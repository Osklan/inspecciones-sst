import { describe, expect, it } from "vitest";
import { informeLocativaHtml, nombreArchivoLocativa } from "./informeLocativa";
import { nuevaInspeccionLocativa, tituloInspeccion } from "./inspeccion";
import { calcularLocativa, nuevoPunto, periodo } from "./locativas";

function ejemplo() {
  const i = nuevaInspeccionLocativa("banos", undefined, new Date(2026, 9, 19, 9, 0));
  i.encabezado.area = "Frentes de obra CCNC";
  i.encabezado.elaboradoPor = "Osneider Mercado";
  const todoC = Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((k) => [k, "C" as const]));
  i.puntos = [
    { ...nuevoPunto("a"), nombre: "LEGGO – antiguo parqueadero nacional", respuestas: { ...todoC, 2: "NC", 4: "NC" }, riesgo: "Agentes biológicos", accion: "Dotar los baños", fotos: ["file:///1.jpg", "file:///2.jpg"] },
    { ...nuevoPunto("b"), nombre: "RCH – FBO Terpel", respuestas: { ...todoC, 6: "NA" } },
    { ...nuevoPunto("c"), nombre: "ANBOG <control>", respuestas: { ...todoC, 5: "NC" }, hallazgo: "Acceso rodeado de escombros.", fotos: ["file:///3.jpg"] },
  ];
  return i;
}

describe("condiciones locativas", () => {
  it("calcula cumplimiento por punto y por aspecto, y los hallazgos", () => {
    const r = calcularLocativa(ejemplo());
    expect(r.puntos.map((p) => p.nc)).toEqual([2, 0, 1]);
    expect(r.puntos[1].cumplimiento).toBe(1);
    expect(r.aspectos[2]).toEqual({ c: 2, nc: 1, na: 0 });
    expect(r.aspectos[6]).toEqual({ c: 2, nc: 0, na: 1 });
    expect(r.total).toMatchObject({ c: 17, nc: 3, na: 1, sinMarcar: 0 });
    expect(r.conHallazgo.map((p) => p.id)).toEqual(["a", "c"]);
    expect(r.calificacion).toBe("CUMPLE PARCIALMENTE");
    expect(r.resumen).toBe("Con hallazgos – 2 hallazgos en 3 puntos inspeccionados");
  });

  it("arma el informe con hallazgos, evidencias numeradas y normas", () => {
    const html = informeLocativaHtml(ejemplo(), { "file:///3.jpg": "QUJD" });
    expect(html).toContain("INFORME DE INSPECCIÓN DE BAÑOS – FRENTES DE OBRA CCNC");
    expect(html).toContain("Octubre/2026");
    // Sin descripción escrita, el hallazgo lista los aspectos NC.
    expect(html).toContain("No cumple: Dotación de papel higiénico");
    expect(html).toContain("(Ver evidencias N° 1, 2)");
    expect(html).toContain("ANBOG &lt;control&gt;:</b> Acceso rodeado de escombros.");
    expect(html).toContain("(Ver evidencia N° 3)");
    expect(html).toContain("Hallazgo N° 2 – ANBOG &lt;control&gt;.");
    expect(html).toContain("data:image/jpeg;base64,QUJD");
    expect(html).toContain("Foto no disponible");
    expect(html).toContain("Resolución 2400 de 1979, Art. 17");
  });

  it("titula y nombra el archivo", () => {
    const i = ejemplo();
    expect(tituloInspeccion(i)).toBe("Baños – Frentes de obra CCNC");
    expect(nombreArchivoLocativa(i)).toBe("Inspeccion_Banos_Frentes_de_obra_CCNC_2026-10-19.pdf");
    expect(periodo("2026-01-05")).toBe("Enero/2026");
  });
});
