// Listas de verificación diligenciadas, en PDF aparte del informe y con las mismas firmas.
import { SST_FO_070, SST_FO_070_VERSION } from "../data/sstFo070";
import { bloquesActivos, calcularResultado, marcarNoAplica } from "./controlOperacional";
import { categoria, nombreEquipo, type InspeccionEquipos } from "./equipos";
import { firmasInforme as firmasEquipos } from "./informeEquipos";
import { firmasInforme as firmasLocativa } from "./informeLocativa";
import { cabecera, celdaRespuesta, CSS, esc, fecha, tablaFirmas } from "./informeComun";
import type { InspeccionFrente } from "./inspeccion";
import { calcularLocativa, grupoEn, listaDe, resultadoPunto, type InspeccionLocativa } from "./locativas";

const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)} %`);
const documento = (cuerpo: string) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
.chk td, .chk th { font-size: 9.5px; padding: 3px 4px; }
.grp td { background: #D9E2F3; font-weight: bold; }
</style></head><body>${cuerpo}</body></html>`;

/** Fila de datos de dos columnas de etiqueta y valor. */
const fila = (a: string, va: string, b: string, vb: string) =>
  `<tr><td class="lbl">${a}</td><td>${va}</td><td class="lbl">${b}</td><td>${vb}</td></tr>`;

export function checklistFrenteHtml(ins: InspeccionFrente): string {
  const e = ins.encabezado;
  const activos = bloquesActivos(SST_FO_070, ins.actividadesCriticas);
  const respuestas = marcarNoAplica(SST_FO_070, activos, ins.respuestas);
  const r = calcularResultado(SST_FO_070, respuestas);
  const nActivos = new Set(activos.map((b) => b.numero));

  const bloques = SST_FO_070.map((b) => {
    const filas = b.items
      .map((it) => {
        const x = respuestas[it.codigo];
        const res = (v: string) => (x?.resultado === v ? "X" : "");
        return `<tr><td>${it.codigo}</td><td>${esc(it.criterio)}</td><td class="${it.criticidad === "Crítico" ? "crit" : ""}">${it.criticidad}</td><td class="c">${res("C")}</td><td class="c crit">${res("NC")}</td><td class="c">${res("NA")}</td><td>${esc(x?.observacion ?? "")}</td></tr>`;
      })
      .join("");
    const nota = nActivos.has(b.numero) ? "" : " – no aplica en este frente";
    return `<tr class="grp"><td colspan="7">${b.numero}. ${esc(b.titulo)}${nota}</td></tr>${filas}`;
  }).join("");

  return documento(`${cabecera("CONTROL OPERACIONAL DE CONTRATISTAS – LISTA DE VERIFICACIÓN", `SST-FO-070 ${SST_FO_070_VERSION}`)}
<table>
${fila("Proyecto / frente", esc(e.proyecto), "Contratista", esc(e.contratista))}
${fila("Ubicación", esc(e.ubicacion), "N° de trabajadores", esc(e.trabajadores))}
${fila("Fecha", fecha(e.fecha), "Hora", esc(e.hora))}
${fila("Responsable SST contratista", esc(e.responsableContratista), "Verificado por (SST OINAC)", esc(e.verificadoPor))}
</table>
<table class="chk"><tr><th>Código</th><th style="width:42%">Criterio de verificación</th><th>Criticidad</th><th class="c">C</th><th class="c">NC</th><th class="c">NA</th><th>Observación</th></tr>${bloques}</table>
<table>
${fila("Cumplimiento", pct(r.total.cumplimiento), "Calificación", r.calificacion ?? "No evaluado")}
${fila("NC críticas / mayores / menores", `${r.ncPorCriticidad["Crítico"]} / ${r.ncPorCriticidad.Mayor} / ${r.ncPorCriticidad.Menor}`, "¿La actividad puede continuar?", `<b>${esc(r.decision)}</b>`)}
</table>
${tablaFirmas([
  { firma: ins.firmas?.oinac, cargo: "Profesional SST OINAC", nombre: e.verificadoPor },
  { firma: ins.firmas?.contratista, cargo: "Profesional SST contratista", nombre: e.responsableContratista },
])}`);
}

export function checklistLocativaHtml(ins: InspeccionLocativa): string {
  const e = ins.encabezado;
  const l = listaDe(ins);
  const r = calcularLocativa(ins);
  const marca = (v: string | undefined, x: string) => `<td class="c${x === "NC" ? " crit" : ""}">${v === x ? "X" : ""}</td>`;

  const puntos = ins.puntos
    .map((p, i) => {
      const rp = resultadoPunto(p, l);
      const filas = l.aspectos
        .map((a, k) => {
          const g = grupoEn(l, k);
          const v = p.respuestas[k];
          return `${g ? `<tr class="grp"><td colspan="5">${esc(g.toUpperCase())}</td></tr>` : ""}<tr><td>${esc(a)}</td>${marca(v, "C")}${marca(v, "NC")}${marca(v, "NA")}<td>${esc(p.observaciones?.[k] ?? "")}</td></tr>`;
        })
        .join("");
      const resultado = rp.nc ? p.hallazgo.trim() || "Con aspectos que no cumplen." : "Cumple con todos los aspectos evaluados.";
      return `<div class="bar"${i ? ' style="page-break-before:always"' : ""}>${i + 1}. ${esc((p.nombre || `Punto ${i + 1}`).toUpperCase())}</div>
<table class="chk"><tr><th style="width:52%">Aspecto a evaluar</th><th class="c">Cumple</th><th class="c">No cumple</th><th class="c">No aplica</th><th>Observaciones</th></tr>${filas}</table>
<table>${fila("Cumplimiento", pct(rp.cumplimiento), "Resultado de inspección", esc(resultado))}</table>`;
    })
    .join("");

  return documento(`${cabecera(`INSPECCIÓN DE ${esc(l.nombre.toUpperCase())} – LISTA DE VERIFICACIÓN`, esc(l.formato ?? e.proyecto))}
<table>
${fila("Fecha", fecha(e.fecha), "Sede / Área", esc(e.area))}
${fila("Responsable de la inspección", esc(e.elaboradoPor), "Responsable del área", esc(e.responsableArea))}
<tr><td class="lbl">Objetivo</td><td colspan="3">${esc(ins.objetivo)}</td></tr>
${fila("Cumplimiento total", pct(r.total.cumplimiento), "Resultado general", esc(r.resumen))}
</table>
${puntos}
<div class="bar">FIRMAS</div>
${tablaFirmas(firmasLocativa(ins))}`);
}

export function checklistEquiposHtml(ins: InspeccionEquipos): string {
  const e = ins.encabezado;
  const secciones = ins.secciones
    .map((s, i) => {
      const cat = categoria(s.categoriaId);
      const n = cat.aspectos.length;
      const leyenda = `<p>${cat.aspectos.map((a, k) => `<b>${k + 1}.</b> ${esc(a)}`).join(" ")}</p>`;
      const filas = s.equipos
        .map((q, k) => `<tr><td class="c">${k + 1}</td><td>${esc(nombreEquipo(q) || "Equipo")}${q.serial ? `<br><i>Serial ${esc(q.serial)}</i>` : ""}</td>${cat.aspectos.map((_, a) => celdaRespuesta(q.aspectos?.[a])).join("")}<td class="c ${q.resultado && q.resultado !== "Apto" ? "crit" : ""}">${esc(q.resultado ?? "")}</td></tr>`)
        .join("");
      return `<div class="bar"${i ? ' style="page-break-before:always"' : ""}>${i + 1}. ${esc(cat.nombre.toUpperCase())}</div>
${leyenda}
<table class="chk"><tr><th class="c">N°</th><th>Equipo</th>${Array.from({ length: n }, (_, k) => `<th class="c">${k + 1}</th>`).join("")}<th class="c">Resultado</th></tr>${filas}</table>`;
    })
    .join("");

  return documento(`${cabecera("INSPECCIÓN DE HERRAMIENTAS, EQUIPOS Y EPP – LISTA DE VERIFICACIÓN", esc(e.proyecto))}
<table>
${fila("Fecha", fecha(e.fecha), "Sede / Área", esc(e.area))}
${fila("Responsable de la inspección", esc(e.elaboradoPor), "Responsable del área", esc(e.responsableArea))}
</table>
<p><i>C = cumple, NC = no cumple, NA = no aplica.</i></p>
${secciones}
<div class="bar">FIRMAS</div>
${tablaFirmas(firmasEquipos(ins))}`);
}

export const nombreArchivoChecklist = (base: string) => base.replace(/\.pdf$/, "_checklist.pdf");
