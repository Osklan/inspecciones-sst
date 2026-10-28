// HTML del informe de herramientas, equipos y EPP, con el formato de los informes mensuales
// de OINAC (equipos contra caídas; LOTO y equipos dieléctricos).
import type { CategoriaEquipo } from "../data/categoriasEquipos";
import { calcularEquipos, categoria, faltantes, firmantesDe, nombreEquipo, vigencia, type Equipo, type InspeccionEquipos, type SeccionEquipos } from "./equipos";
import { cabecera, CSS, esc, evidenciasVisita, fecha, filasEvidencias, limpio, parrafos, tablaDatosGenerales, tablaFirmas, vinetas, type CeldaFirma } from "./informeComun";
import { periodo } from "./locativas";

const resultado = (e: Equipo) => `<td class="c ${e.resultado && e.resultado !== "Apto" ? "crit" : ""}">${esc(e.resultado ?? "—")}</td>`;

function fechaPrueba(e: Equipo, cat: CategoriaEquipo, fechaInspeccion: string): string {
  const v = vigencia(e, cat, fechaInspeccion);
  if (!e.fechaPrueba) return "No registrada";
  return `${fecha(e.fechaPrueba)}${v === "vencida" ? ' <span class="crit">(vencida)</span>' : ""}`;
}

function tabla(s: SeccionEquipos, cat: CategoriaEquipo, fechaInspeccion: string): string {
  const eq = s.equipos;
  switch (cat.formato) {
    case "inventario":
      return `<table><tr><th class="c">N°</th><th>Titular</th><th>Elemento</th><th>Marca</th><th>Serial</th><th class="c">Resultado</th></tr>${eq
        .map((e, i) => `<tr><td class="c">${i + 1}</td><td>${esc(e.titular)}</td><td>${esc(e.elemento)}</td><td>${esc(e.marca)}</td><td>${esc(e.serial)}</td>${resultado(e)}</tr>`)
        .join("")}</table>`;
    case "kit": {
      const comps = cat.componentes ?? [];
      const head = `<tr><th>Dispositivo</th>${eq.map((e) => `<th class="c">${esc(e.titular)}</th>`).join("")}</tr>`;
      const filas = comps
        .map((c, k) => `<tr><td>${esc(c)}</td>${eq.map((e) => `<td class="c">${e.componentes?.[k] === false ? '<span class="crit">Falta</span>' : "X"}</td>`).join("")}</tr>`)
        .join("");
      const tot = `<tr><td><b>Total de elementos disponibles</b></td>${eq.map((e) => `<td class="c"><b>${comps.length - faltantes(e, cat).length}</b></td>`).join("")}</tr>`;
      const res = `<tr><td><b>Resultado</b></td>${eq.map(resultado).join("")}</tr>`;
      return `<table>${head}${filas}${tot}${res}</table><p><i>X = disponible.</i></p>`;
    }
    case "condicion":
      return `<table><tr><th class="c">Kit N°</th><th>Equipo</th><th>Condición observada</th><th class="c">Resultado</th></tr>${eq
        .map((e) => `<tr><td class="c">${esc(e.titular)}</td><td>${esc(e.elemento)}</td><td>${esc(e.condicion)}</td>${resultado(e)}</tr>`)
        .join("")}</table>`;
    case "certificado":
      return `<table><tr><th class="c">N°</th><th>Asignado a</th><th>Equipo</th><th>Última prueba${s.laboratorio ? ` (${esc(s.laboratorio)})` : ""}</th><th>Código de prueba</th><th class="c">Resultado</th></tr>${eq
        .map((e, i) => `<tr><td class="c">${i + 1}</td><td>${esc(e.titular)}</td><td>${esc(e.elemento)}</td><td>${fechaPrueba(e, cat, fechaInspeccion)}</td><td>${esc(e.codigoPrueba)}</td>${resultado(e)}</tr>`)
        .join("")}</table>`;
    case "inspeccionAnual":
      return `<table><tr><th>Equipo</th><th>Última inspección anual</th><th>Condición observada</th><th class="c">Resultado</th></tr>${eq
        .map((e) => `<tr><td>${esc(nombreEquipo(e))}</td><td>${fechaPrueba(e, cat, fechaInspeccion)}</td><td>${esc(e.condicion)}</td>${resultado(e)}</tr>`)
        .join("")}</table>`;
  }
}

/** @param fotos Mapa de URI de foto → contenido JPEG en base64. */
export function informeEquiposHtml(ins: InspeccionEquipos, fotos: Record<string, string> = {}): string {
  const e = ins.encabezado;
  const r = calcularEquipos(ins);
  const cats = ins.secciones.map((s) => categoria(s.categoriaId));
  const titulo = `INFORME DE INSPECCIÓN DE ${cats.length === 1 ? cats[0].nombre.toUpperCase() : "HERRAMIENTAS, EQUIPOS Y EPP"}`;
  const aspectos = [...new Set(cats.flatMap((c) => c.aspectos))];

  let n = 0;
  const evidencias = ins.secciones.flatMap((s) => s.equipos.flatMap((q) => q.fotos.map((uri) => ({ n: ++n, q, uri }))));
  const evRef = (id: string) => {
    const ns = evidencias.filter((x) => x.q.id === id).map((x) => x.n);
    return ns.length ? `<br><i>(Ver evidencia${ns.length > 1 ? "s" : ""} N° ${ns.join(", ")})</i>` : "";
  };

  const resultados = ins.secciones
    .map((s, i) => {
      const cat = cats[i];
      return `<p><b>5.${i + 1} ${esc(cat.nombre)}</b></p>${parrafos(s.texto, "")}${s.equipos.length ? tabla(s, cat, e.fecha) : "<p>No se inspeccionaron equipos de esta categoría.</p>"}`;
    })
    .join("");

  const filasHallazgos = r.hallazgos
    .map((h, i) => `<tr><td class="c">${i + 1}</td><td>${esc(h.texto)}${evRef(h.equipo.id)}</td><td>${esc(h.equipo.riesgo)}</td><td>${esc(h.equipo.accion)}</td><td>${esc(h.equipo.estado)}</td></tr>`)
    .join("");

  const visita = evidenciasVisita(ins.fotosVisita, n, fotos, e.area, e.fecha);
  const filasEv = filasEvidencias([
    ...evidencias.map((x) => ({
      n: x.n,
      b64: fotos[x.uri],
      descripcion: `${esc(nombreEquipo(x.q) || "Equipo")}${x.q.serial ? `, serial ${esc(x.q.serial)}` : ""}.${x.q.condicion ? ` ${esc(x.q.condicion)}` : ""}`,
      fecha: e.fecha,
    })),
    ...visita,
  ]);

  let sec = 0;
  const bar = (t: string, extra = "") => `<div class="bar"${extra}>${++sec}. ${t}</div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
${cabecera(esc(titulo))}

${bar("DATOS GENERALES")}
${tablaDatosGenerales(e, periodo(e.fecha), r.resumen)}

${bar("OBJETIVO")}
${parrafos(ins.objetivo)}

${bar("ALCANCE – EQUIPOS INSPECCIONADOS")}
<p>La inspección comprendió los siguientes equipos${e.area ? ` del área de ${esc(e.area)}` : ""}:</p>
<ul>${ins.secciones.map((s, i) => `<li>${esc(cats[i].nombre)}: ${s.equipos.length} ${s.equipos.length === 1 ? "equipo" : "equipos"}.</li>`).join("")}</ul>
<p>Resultado: ${r.porResultado.Apto} aptos, ${r.porResultado["No apto"]} no aptos y ${r.porResultado["En prueba"]} en prueba${r.vencidas ? `; ${r.vencidas} con prueba o inspección anual vencida` : ""}.</p>

${bar("METODOLOGÍA")}
<p>La inspección se realizó mediante revisión visual y funcional de cada equipo, verificando los siguientes aspectos:</p>
<ul>${aspectos.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>

${bar("RESULTADOS DE LA INSPECCIÓN")}
${resultados}

${bar("HALLAZGOS Y PLAN DE ACCIÓN")}
${r.hallazgos.length ? `<table><tr><th class="c">N°</th><th style="width:32%">Hallazgo</th><th>Riesgo asociado</th><th>Acción recomendada</th><th>Estado</th></tr>${filasHallazgos}</table>` : "<p>No se registraron hallazgos: todos los equipos inspeccionados son aptos.</p>"}

${bar("CONCLUSIONES")}
${vinetas(ins.conclusiones)}

${bar("RECOMENDACIONES")}
${vinetas(ins.recomendaciones)}

${bar("FIRMAS")}
${tablaFirmas(firmasInforme(ins))}

${evidencias.length + visita.length ? `${bar("ANEXO – EVIDENCIA FOTOGRÁFICA", ' style="page-break-before:always"')}<table class="ev">${filasEv}</table>` : ""}
</body></html>`;
}

/** SST que elabora y revisa, propietarios del EPP y responsables presentes. */
export const firmasInforme = (ins: InspeccionEquipos): CeldaFirma[] => [
  { firma: ins.firmas?.elaboro, cargo: `Inspeccionó – ${ins.encabezado.cargoElaboro}`, nombre: ins.encabezado.elaboradoPor },
  ...firmantesDe(ins).map((f) => ({ firma: f.firma, cargo: f.rol, nombre: f.nombre })),
];

export function nombreArchivoEquipos(ins: InspeccionEquipos): string {
  return `Inspeccion_Equipos${ins.encabezado.area ? `_${limpio(ins.encabezado.area)}` : ""}_${ins.encabezado.fecha}.pdf`;
}
