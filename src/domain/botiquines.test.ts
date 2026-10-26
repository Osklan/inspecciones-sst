import { describe, expect, it } from "vitest";
import { ELEMENTOS_BOTIQUIN } from "../data/botiquin";
import { calcularBotiquines, evaluarElemento, nuevoBotiquin, type RegistroElemento } from "./botiquines";
import { checklistBotiquinesHtml, informeBotiquinesHtml } from "./informeBotiquines";
import { nuevaInspeccionBotiquines, tituloInspeccion } from "./inspeccion";

const ok = (k: number): RegistroElemento => ({ cantidad: String(ELEMENTOS_BOTIQUIN[k].minimo), estado: "Bueno", vence: "", observacion: "" });

function ejemplo() {
  const i = nuevaInspeccionBotiquines(undefined, new Date(2026, 9, 26));
  i.encabezado.area = "Frentes de obra";
  i.encabezado.elaboradoPor = "Osneider Mercado";
  const completo = Object.fromEntries(ELEMENTOS_BOTIQUIN.map((_, k) => [k, ok(k)]));
  i.botiquines = [
    { ...nuevoBotiquin("a"), area: "Almacén <LEGGO>", responsable: "Ana Pérez", elementos: { ...completo } },
    {
      ...nuevoBotiquin("b"), area: "Oficina RCH", responsable: "Luis Gómez", fotos: ["file:///b.jpg"],
      elementos: {
        ...completo,
        2: { ...ok(2), cantidad: "1" },
        3: { ...ok(3), estado: "Malo" },
        13: { ...ok(13), vence: "2026-10-01" },
        14: { ...ok(14), vence: "2026-11-10" },
      },
    },
  ];
  return i;
}

describe("botiquines (SST-FO-077)", () => {
  it("evalúa cantidad mínima, estado y vencimiento", () => {
    expect(evaluarElemento(ok(0), 0, "2026-10-26")).toEqual({ diligenciado: true, novedades: [], conforme: true });
    expect(evaluarElemento({ ...ok(2), cantidad: "1" }, 2, "2026-10-26").novedades).toEqual(["falta"]);
    // Sin existencias no hace falta marcar el estado.
    expect(evaluarElemento({ cantidad: "0", vence: "", observacion: "" }, 0, "2026-10-26")).toMatchObject({ diligenciado: true, conforme: false });
    expect(evaluarElemento({ ...ok(0), vence: "2026-11-20" }, 0, "2026-10-26")).toMatchObject({ novedades: ["por vencer"], conforme: true });
    expect(evaluarElemento(undefined, 0, "2026-10-26").diligenciado).toBe(false);
  });

  it("resume los botiquines y arma el hallazgo", () => {
    const r = calcularBotiquines(ejemplo());
    expect(r.sinDiligenciar).toBe(0);
    expect(r.botiquines[1]).toMatchObject({ faltantes: 1, malos: 1, vencidos: 1, porVencer: 1, conformes: 13 });
    expect(r.conHallazgo.map((b) => b.id)).toEqual(["b"]);
    expect(r.botiquines[1].hallazgo).toContain("Solución salina 250 cc o 500 cc (1 de 2 und)");
    expect(r.botiquines[1].hallazgo).toContain("Tapabocas (01/10/2026)");
    expect(r.resumen).toBe("Con hallazgos – 1 de 2 botiquines con novedades");
    expect(tituloInspeccion(ejemplo())).toBe("Botiquines – Frentes de obra");
  });

  it("genera el informe y el formato diligenciado con firmas", () => {
    const ins = ejemplo();
    ins.botiquines[0].firma = { trazos: ["M1 1 L9 9"], ancho: 300, alto: 160, fecha: 0 };
    const inf = informeBotiquinesHtml(ins, { "file:///b.jpg": "QUJD" });
    expect(inf).toContain("INFORME DE INSPECCIÓN DE BOTIQUINES");
    expect(inf).toContain("Almacén &lt;LEGGO&gt;");
    expect(inf).toContain("(Ver evidencia N° 1)");
    expect(inf).toContain("Responsable – Oficina RCH");
    const chk = checklistBotiquinesHtml(ins);
    expect(chk.match(/INSPECCIÓN DE BOTIQUÍN</g)).toHaveLength(2);
    expect(chk).toContain("SST-FO-077 V01");
    expect(chk).toContain("Firma responsable");
    expect(chk).toContain('<path d="M1 1 L9 9"/>');
    expect(chk).toContain("Bajo el mínimo");
  });

  it("repite los botiquines de la inspección anterior sin lo registrado", () => {
    const n = nuevaInspeccionBotiquines(ejemplo(), new Date(2026, 10, 26));
    expect(n.botiquines.map((b) => [b.area, b.responsable])).toEqual([["Almacén <LEGGO>", "Ana Pérez"], ["Oficina RCH", "Luis Gómez"]]);
    expect(n.botiquines[1].elementos).toEqual({});
    expect(n.encabezado.elaboradoPor).toBe("Osneider Mercado");
  });
});
