import { describe, expect, it } from "vitest";
import { calcularEquipos, categoria, nuevoEquipo, vigencia } from "./equipos";
import { informeEquiposHtml, nombreArchivoEquipos } from "./informeEquipos";
import { nuevaInspeccionEquipos, tituloInspeccion } from "./inspeccion";

function ejemplo() {
  const i = nuevaInspeccionEquipos(["loto", "guantes-dielectricos", "pertigas-alfombras"], undefined, false, new Date(2026, 8, 29));
  i.encabezado.area = "Mantenimiento eléctrico";
  const [loto, guantes, pertigas] = i.secciones;
  const kit = (id: string, titular: string) => ({ ...nuevoEquipo(id, categoria("loto")), titular, resultado: "Apto" as const });
  loto.equipos = [kit("k1", "Andrés Luque"), { ...kit("k2", "Wilmer Polo"), componentes: { ...kit("x", "").componentes, 4: false }, resultado: "No apto" as const }];
  guantes.laboratorio = "Testlab SAS";
  guantes.equipos = [
    { ...nuevoEquipo("g1"), titular: "Martín Cruz", elemento: "Sofamel SG-50 – Clase 0", fechaPrueba: "2026-07-16", codigoPrueba: "2640923003", resultado: "Apto" },
    { ...nuevoEquipo("g2"), titular: "Andrés Luque", elemento: "Clase 4", fechaPrueba: "2026-02-10", resultado: "Apto" },
  ];
  pertigas.equipos = [
    { ...nuevoEquipo("p1"), elemento: "Pértiga de rescate", fechaPrueba: "2025-10-23", condicion: "Enviada a prueba de rigidez dieléctrica", resultado: "En prueba", estado: "En proceso", fotos: ["file:///p1.jpg"] },
    { ...nuevoEquipo("p2"), elemento: "Pértiga para medición de ausencia de tensión", condicion: "Presenta deterioro estructural", resultado: "No apto", riesgo: "Contacto eléctrico", accion: "Reemplazar" },
  ];
  return i;
}

describe("equipos y EPP", () => {
  it("cuenta resultados, vencimientos y hallazgos", () => {
    const r = calcularEquipos(ejemplo());
    expect(r.total).toBe(6);
    expect(r.porResultado).toEqual({ Apto: 3, "No apto": 2, "En prueba": 1 });
    // Guantes probados el 10/02/2026 vencen a los 6 meses, antes del 29/09/2026.
    expect(r.vencidas).toBe(1);
    expect(r.hallazgos.map((h) => h.texto)).toEqual([
      "Al kit de Wilmer Polo le faltan: Mini aldaba dieléctrica.",
      "Pértiga de rescate: Enviada a prueba de rigidez dieléctrica.",
      "Pértiga para medición de ausencia de tensión: Presenta deterioro estructural.",
    ]);
  });

  it("calcula la vigencia de la prueba según la categoría", () => {
    const g = categoria("guantes-dielectricos");
    expect(vigencia({ fechaPrueba: "2026-04-22" }, g, "2026-09-29")).toBe("vigente");
    expect(vigencia({ fechaPrueba: "2026-03-28" }, g, "2026-09-29")).toBe("vencida");
    expect(vigencia({ fechaPrueba: "" }, g, "2026-09-29")).toBe("sin registro");
    expect(vigencia({ fechaPrueba: "" }, categoria("traje-arco"), "2026-09-29")).toBeNull();
  });

  it("copia los equipos de la inspección anterior sin resultados ni fotos", () => {
    const ant = ejemplo();
    const n = nuevaInspeccionEquipos(["pertigas-alfombras", "traje-arco"], ant, true, new Date(2026, 9, 29));
    expect(n.secciones.map((s) => s.categoriaId)).toEqual(["pertigas-alfombras", "traje-arco"]);
    const p = n.secciones[0].equipos;
    expect(p.map((e) => e.elemento)).toEqual(["Pértiga de rescate", "Pértiga para medición de ausencia de tensión"]);
    expect(p[0]).toMatchObject({ fechaPrueba: "2025-10-23", condicion: "", fotos: [] });
    expect(p[0].resultado).toBeUndefined();
    expect(n.secciones[1].equipos).toHaveLength(1);
    expect(n.encabezado.area).toBe("Mantenimiento eléctrico");
  });

  it("arma el informe con la matriz del kit, vencimientos y hallazgos", () => {
    const html = informeEquiposHtml(ejemplo(), { "file:///p1.jpg": "QUJD" });
    expect(html).toContain("INFORME DE INSPECCIÓN DE HERRAMIENTAS, EQUIPOS Y EPP");
    expect(html).toContain("Septiembre/2026");
    expect(html).toContain("<th>Última prueba (Testlab SAS)</th>");
    expect(html).toContain('10/02/2026 <span class="crit">(vencida)</span>');
    expect(html).toContain('<span class="crit">Falta</span>');
    expect(html).toContain("<td class=\"c\"><b>9</b></td>");
    expect(html).toContain("(Ver evidencia N° 1)");
    expect(html).toContain("<td>En proceso</td>");
    expect(html).toContain("3 aptos, 2 no aptos y 1 en prueba; 1 con prueba o inspección anual vencida");
    expect(tituloInspeccion(ejemplo())).toBe("Equipos y EPP – Mantenimiento eléctrico");
    expect(nombreArchivoEquipos(ejemplo())).toBe("Inspeccion_Equipos_Mantenimiento_electrico_2026-09-29.pdf");
  });
});
