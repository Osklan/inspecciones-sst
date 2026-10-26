import { describe, expect, it } from "vitest";
import { SST_FO_070 } from "../data/sstFo070";
import { checklistEquiposHtml, checklistFrenteHtml, checklistLocativaHtml, nombreArchivoChecklist } from "./checklists";
import { categoria, firmantesDe, nuevoEquipo } from "./equipos";
import { informeEquiposHtml } from "./informeEquipos";
import { fotosDe, nuevaInspeccionEquipos, nuevaInspeccionFrente, nuevaInspeccionLocativa } from "./inspeccion";
import { nuevoPunto } from "./locativas";

const firma = (d: string) => ({ trazos: [d], ancho: 300, alto: 160, fecha: 0 });

describe("listas de verificación diligenciadas", () => {
  it("SST-FO-070: todos los ítems, con NA en bloques no activos y las firmas", () => {
    const i = nuevaInspeccionFrente(undefined, new Date(2026, 9, 26));
    i.actividadesCriticas = ["IZA"];
    i.respuestas = { "GEN-02": { resultado: "NC", observacion: "Escombro <en> paso" } };
    i.firmas = { contratista: firma("M2 2 L8 8") };
    const html = checklistFrenteHtml(i);
    const total = SST_FO_070.reduce((s, b) => s + b.items.length, 0);
    expect(html.match(/<tr><td>[A-Z]{3}-\d{2}<\/td>/g)).toHaveLength(total);
    expect(html).toContain("Escombro &lt;en&gt; paso");
    expect(html).toContain("ESPACIOS CONFINADOS (Res. 0491/2020) – si aplica – no aplica en este frente");
    expect(html).toContain('<path d="M2 2 L8 8"/>');
    expect(html).toContain("INSPECCIÓN INCOMPLETA");
  });

  it("parqueaderos (SST-FO-072): subtítulos, marcas, observaciones y resultado por punto", () => {
    const i = nuevaInspeccionLocativa("parqueadero", undefined, new Date(2026, 9, 26));
    expect(i.objetivo).toContain("Prevenir lesiones y enfermedades laborales");
    i.puntos = [{ ...nuevoPunto("p"), nombre: "Parqueadero norte", respuestas: { 0: "C", 6: "NC" }, observaciones: { 6: "Sin extintor" } }];
    const html = checklistLocativaHtml(i);
    expect(html).toContain("SST-FO-072 V01");
    expect(html).toContain("PUNTO DE ENCUENTRO");
    expect(html).toContain("Sin extintor");
    expect(html).toContain("Con aspectos que no cumplen.");
  });

  it("equipos: firmas de propietarios y de quien estuvo presente en los de uso común", () => {
    const i = nuevaInspeccionEquipos(["contra-caidas", "traje-arco"], undefined, false, new Date(2026, 9, 26));
    i.secciones[0].equipos = [
      { ...nuevoEquipo("1"), titular: "Ana Pérez", elemento: "Arnés", resultado: "Apto", aspectos: { 0: "C", 1: "NC" } },
      { ...nuevoEquipo("2"), titular: "ana pérez ", elemento: "Eslinga", resultado: "Apto" },
      { ...nuevoEquipo("3"), titular: "Luis Gómez", elemento: "Arnés", resultado: "Apto" },
    ];
    i.secciones[1].equipos = [{ ...nuevoEquipo("4", categoria("traje-arco")), titular: "#1", elemento: "Traje", resultado: "Apto" }];
    const f = firmantesDe(i);
    expect(f.map((x) => [x.rol, x.nombre])).toEqual([
      ["Propietario del EPP", "Ana Pérez"],
      ["Propietario del EPP", "Luis Gómez"],
      ["Responsable presente", ""],
    ]);
    // Las firmas guardadas se conservan.
    i.firmantes = [{ ...f[1], firma: firma("M3 3 L7 7") }, { ...f[2], nombre: "Wilmer Polo" }];
    expect(firmantesDe(i).map((x) => x.nombre)).toEqual(["Ana Pérez", "Luis Gómez", "Wilmer Polo"]);
    expect(informeEquiposHtml(i)).toContain('<path d="M3 3 L7 7"/>');
    const chk = checklistEquiposHtml(i);
    expect(chk).toContain("Responsable presente");
    expect(chk).toContain('<td class="c crit">NC</td>');
    expect(chk).toContain("<b>10.</b> Limpieza y almacenamiento del equipo.");
  });

  it("nombra el archivo y reúne las fotos", () => {
    expect(nombreArchivoChecklist("Inspeccion_Banos_2026-10-26.pdf")).toBe("Inspeccion_Banos_2026-10-26_checklist.pdf");
    const i = nuevaInspeccionLocativa("banos");
    i.puntos[0].fotos = ["a", "b"];
    expect(fotosDe(i)).toEqual(["a", "b"]);
  });
});
