import { describe, expect, it } from "vitest";
import { SST_FO_070 } from "../data/sstFo070";
import { checklistEquiposHtml, checklistFrenteHtml, checklistLocativaHtml, nombreArchivoChecklist } from "./checklists";
import { aspectosDe, categoria, firmantesDe, nuevoEquipo, siNo, tipoDe } from "./equipos";
import { informeEquiposHtml } from "./informeEquipos";
import { informeLocativaHtml } from "./informeLocativa";
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
    expect(html.match(/<tr><td style="white-space:nowrap">[A-Z]{3}-\d{2}<\/td>/g)).toHaveLength(total);
    expect(html).toContain("Escombro &lt;en&gt; paso");
    expect(html).toContain("ESPACIOS CONFINADOS (Res. 0491/2020) – si aplica – no aplica en este frente");
    expect(html).toContain('<path d="M2 2 L8 8"/>');
    expect(html).toContain("INSPECCIÓN INCOMPLETA");
    expect(html).toContain("Evidencia a verificar");
    expect(html).toContain("ACCIONES TOMADAS EN SITIO");
    expect(html).toContain("PLAN DE ACCIÓN Y SEGUIMIENTO DE NO CONFORMIDADES");
  });

  it("concesiones (SST-FO-086): numeración del formato, datos y firmas de cada concesión", () => {
    const i = nuevaInspeccionLocativa("concesiones", undefined, new Date(2026, 9, 26));
    i.encabezado.elaboradoPor = "Osneider Mercado";
    i.firmas = { elaboro: firma("M5 5 L6 6") };
    i.puntos = [{
      ...nuevoPunto("p"), nombre: "Café del Mar",
      respuestas: { 20: "NC", 28: "C" },
      observaciones: { 20: "Sin FDS" },
      campos: { hora: "08:30", tipo: "SST, Bombero", bombero: "Carlos Ruiz", responsable: "Ana Gil" },
      firmas: { bombero: firma("M1 1 L2 2") },
    }];
    const html = checklistLocativaHtml(i);
    expect(html).toContain("FORMATO DE INSPECCIÓN INTEGRAL A CONCESIONES");
    expect(html).toContain("SST-FO-086 V01");
    expect(html).toContain('<td class="c">22</td><td>Fichas técnicas disponibles (si aplica)</td>');
    expect(html).toContain("☒ SST");
    expect(html).toContain("☐ MTT");
    expect(html).toContain("Sin FDS");
    expect(html).toContain('<path d="M1 1 L2 2"/>');
    // Sin firma propia del inspector, se usa la de Elaboró.
    expect(html).toContain('<path d="M5 5 L6 6"/>');
    expect(html).toContain("Responsable del área");
    const inf = informeLocativaHtml(i);
    expect(inf).toContain("Bombero – Café del Mar");
    expect(inf).not.toContain("Inspector SST – Café del Mar");
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
    const i = nuevaInspeccionEquipos(["contra-caidas", "traje-arco", "loto"], undefined, false, new Date(2026, 9, 26));
    i.secciones[0].equipos = [
      { ...nuevoEquipo("1"), titular: "Ana Pérez", elemento: "Arnés", resultado: "Apto" },
      { ...nuevoEquipo("2"), titular: "ana pérez ", elemento: "Eslinga", resultado: "Apto" },
      { ...nuevoEquipo("3"), titular: "Luis Gómez", elemento: "Arnés", resultado: "Apto" },
    ];
    i.secciones[1].equipos = [{ ...nuevoEquipo("4", categoria("traje-arco")), titular: "#1", elemento: "Traje", resultado: "Apto" }];
    i.secciones[2].equipos = [{ ...nuevoEquipo("5", categoria("loto")), titular: "Juan", resultado: "Apto", aspectos: { 0: "NC" } }];
    const f = firmantesDe(i);
    expect(f.map((x) => [x.rol, x.nombre])).toEqual([
      ["Propietario del EPP", "Ana Pérez"],
      ["Propietario del EPP", "Luis Gómez"],
      ["Propietario del EPP", "Juan"],
      ["Responsable presente", ""],
    ]);
    // Las firmas guardadas se conservan.
    i.firmantes = [{ ...f[1], firma: firma("M3 3 L7 7") }, { ...f[3], nombre: "Wilmer Polo" }];
    expect(firmantesDe(i).map((x) => x.nombre)).toEqual(["Ana Pérez", "Luis Gómez", "Juan", "Wilmer Polo"]);
    expect(informeEquiposHtml(i)).toContain('<path d="M3 3 L7 7"/>');
    const chk = checklistEquiposHtml(i);
    expect(chk).toContain('<td class="c crit">NC</td>');
    expect(chk).toContain("<b>6.</b> Funcionamiento de los mecanismos de bloqueo.");
    // Una ficha SST-FO-085 por propietario, con sus equipos, y una SST-FO-087 por kit.
    expect(chk.match(/INSPECCIÓN DE EQUIPOS DE PROTECCIÓN CONTRA CAÍDAS</g)).toHaveLength(2);
    expect(chk.match(/INSPECCIÓN DE TRAJE DE PROTECCIÓN CONTRA ARCO ELÉCTRICO</g)).toHaveLength(1);
    expect(chk).toContain("Wilmer Polo");
  });

  it("fichas SST-FO-085 / SST-FO-087: SI / NO según la redacción y el traje con su capucha", () => {
    const caidas = categoria("contra-caidas");
    const esl = { ...nuevoEquipo("e"), elemento: "Eslinga de posicionamiento" };
    expect(tipoDe(esl, caidas)?.id).toBe("eslinga-posicionamiento");
    expect(tipoDe({ ...esl, elemento: "Eslinga doble con absorbedor" }, caidas)?.id).toBe("eslinga");
    const arnes = aspectosDe({ ...esl, tipoElemento: "arnes" }, caidas);
    expect(arnes).toHaveLength(16);
    expect(arnes[1]).toMatchObject({ texto: "Cintas deshilachadas", parte: "Cintas y/o correas", bueno: "NO" });
    expect(siNo("C", "NO")).toBe("NO");
    expect(siNo("NC", "NO")).toBe("SI");
    expect(siNo("C", "SI")).toBe("SI");
    expect(aspectosDe({ ...esl, tipoElemento: "eslinga" }, caidas)).toHaveLength(20);

    const i = nuevaInspeccionEquipos(["traje-arco", "careta-arco"], undefined, false, new Date(2026, 9, 26));
    i.encabezado.area = "Subestación 2";
    i.secciones[0].equipos = [{ ...nuevoEquipo("t"), titular: "Kit 1", elemento: "Traje 40 cal", resultado: "No apto", aspectos: { 0: "NC" }, obsAspectos: { 0: "Quemadura en manga" }, accion: "Retirar" }];
    i.secciones[1].equipos = [{ ...nuevoEquipo("c"), titular: "kit 1", elemento: "Capucha", resultado: "Apto", ultimoLavado: "2026-09-01" }];
    const chk = checklistEquiposHtml(i);
    expect(chk.match(/INSPECCIÓN DE TRAJE DE PROTECCIÓN CONTRA ARCO ELÉCTRICO</g)).toHaveLength(1);
    expect(chk).toContain("SST-FO-087 V01");
    expect(chk).toContain("CAPUCHA CON VISOR");
    expect(chk).toContain("Quemadura en manga");
    expect(chk).toContain("01/09/2026");
    expect(chk).toContain("Subestación 2");
    expect(chk).toContain('NO ( <span class="crit">X</span> )');
    expect(chk).toContain("Quién inspecciona");
    expect(chk).not.toContain("LISTAS DE VERIFICACIÓN");
  });

  it("nombra el archivo y reúne las fotos", () => {
    expect(nombreArchivoChecklist("Inspeccion_Banos_2026-10-26.pdf")).toBe("Inspeccion_Banos_2026-10-26_checklist.pdf");
    const i = nuevaInspeccionLocativa("banos");
    i.puntos[0].fotos = ["a", "b"];
    expect(fotosDe(i)).toEqual(["a", "b"]);
  });
});
