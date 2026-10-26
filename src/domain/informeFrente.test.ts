import { describe, expect, it } from "vitest";
import { SST_FO_070 } from "../data/sstFo070";
import { informeFrenteHtml, nombreArchivoInforme } from "./informeFrente";
import { nuevaInspeccionFrente } from "./inspeccion";

function ejemplo() {
  const i = nuevaInspeccionFrente(undefined, new Date(2026, 9, 19, 9, 30));
  i.encabezado.contratista = "Contratista LEGGO <obra>";
  i.encabezado.verificadoPor = "Osneider Mercado";
  i.actividadesCriticas = ["ALO"];
  const todoC = Object.fromEntries(SST_FO_070.flatMap((b) => b.items.map((it) => [it.codigo, { resultado: "C" as const }])));
  i.respuestas = {
    ...todoC,
    "ALO-04": { resultado: "NC", observacion: "Trabajador sin conexión en eje 4", fotos: ["file:///a.jpg", "file:///b.jpg"] },
    "GEN-02": { resultado: "NC", observacion: "Escombro en zona de paso" },
  };
  return i;
}

describe("informe del SST-FO-070", () => {
  it("incluye encabezado, resultado, NC con fecha límite y escapa el texto", () => {
    const html = informeFrenteHtml(ejemplo(), { "file:///a.jpg": "QUJD" });
    expect(html).toContain("CONTROL OPERACIONAL DE CONTRATISTAS");
    expect(html).toContain("Contratista LEGGO &lt;obra&gt;");
    expect(html).not.toContain("<obra>");
    expect(html).toContain("19/10/2026");
    expect(html).toContain("ALO-04");
    expect(html).toContain("NO – detener las tareas con NC crítica");
    // GEN-02 es Menor: 5 días.
    expect(html).toContain("24/10/2026");
    // Bloques no activos se informan como NA.
    expect(html).toContain("No aplican en este frente");
    // Referencias normativas pedidas por SST OINAC.
    expect(html).toContain("Resolución 5018 de 2019");
    expect(html).toContain("ASME B30");
    expect(html).toContain("OSHA 29 CFR 1926 Subparte CC");
  });

  it("numera las evidencias, las referencia desde la NC y marca las fotos que faltan", () => {
    const html = informeFrenteHtml(ejemplo(), { "file:///a.jpg": "QUJD" });
    expect(html).toContain("EVIDENCIA N° 1");
    expect(html).toContain("EVIDENCIA N° 2");
    expect(html).toContain("(Ver evidencias N° 1, 2)");
    expect(html).toContain("data:image/jpeg;base64,QUJD");
    expect(html).toContain("Foto no disponible");
  });

  it("incluye las firmas dibujadas", () => {
    const i = ejemplo();
    i.firmas = { oinac: { trazos: ["M10 10 L50 40"], ancho: 300, alto: 160, fecha: 0 } };
    const html = informeFrenteHtml(i);
    expect(html).toContain('<path d="M10 10 L50 40"/>');
    expect(html).toContain("Profesional SST contratista");
  });

  it("arma un nombre de archivo sin tildes ni espacios", () => {
    const i = ejemplo();
    i.encabezado.contratista = "Construcciones Núñez S.A.S.";
    expect(nombreArchivoInforme(i)).toBe("SST-FO-070_Construcciones_Nunez_S_A_S_2026-10-19.pdf");
  });
});
