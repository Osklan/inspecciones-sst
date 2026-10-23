// HTML del informe del SST-FO-070, con el formato de los informes de OINAC.
// El PDF se genera a partir de este HTML con expo-print.
import { SST_FO_070, SST_FO_070_VERSION } from "../data/sstFo070";
import { bloquesActivos, calcularResultado, generarPlanAccion, marcarNoAplica } from "./controlOperacional";
import { cabecera, celdaFirma, CSS, esc, fecha, filasEvidencias, limpio } from "./informeComun";
import type { InspeccionFrente } from "./inspeccion";

const REFERENCIAS = [
  "Decreto 1072 de 2015 y Resolución 0312 de 2019 (SG-SST y gestión de contratistas).",
  "Resolución 4272 de 2021 (trabajo en alturas).",
  "Resolución 0491 de 2020 (espacios confinados).",
  "RETIE – Reglamento Técnico de Instalaciones Eléctricas.",
  "NFPA 51B (trabajos en caliente) y OSHA 1926 Subparte P (excavaciones), como referencias técnicas complementarias.",
];

const pct = (x: number | null) => (x === null ? "No evaluado" : `${Math.round(x * 100)} %`);

/** @param fotos Mapa de URI de foto → contenido JPEG en base64. */
export function informeFrenteHtml(ins: InspeccionFrente, fotos: Record<string, string> = {}): string {
  const e = ins.encabezado;
  const activos = bloquesActivos(SST_FO_070, ins.actividadesCriticas);
  const respuestas = marcarNoAplica(SST_FO_070, activos, ins.respuestas);
  const r = calcularResultado(SST_FO_070, respuestas);
  const plan = generarPlanAccion(SST_FO_070, respuestas, e.fecha);
  const nActivos = new Set(activos.map((b) => b.numero));
  let n = 0;

  const items = new Map(SST_FO_070.flatMap((b) => b.items.map((i) => [i.codigo, i] as const)));
  const evidencias = plan.flatMap((p) =>
    (respuestas[p.codigo]?.fotos ?? []).map((uri) => ({ n: ++n, codigo: p.codigo, hallazgo: p.hallazgo, uri })),
  );

  const filasBloques = r.bloques
    .filter((b) => nActivos.has(b.numero))
    .map((b) => `<tr><td>${b.numero}. ${esc(b.titulo)}</td><td class="c">${b.c}</td><td class="c">${b.nc}</td><td class="c">${b.na}</td><td class="c">${pct(b.cumplimiento)}</td></tr>`)
    .join("");
  const noActivos = SST_FO_070.filter((b) => !nActivos.has(b.numero)).map((b) => `${b.numero}. ${b.titulo}`);

  const evRef = (codigo: string) => {
    const ns = evidencias.filter((x) => x.codigo === codigo).map((x) => x.n);
    return ns.length ? `<br><i>(Ver evidencia${ns.length > 1 ? "s" : ""} N° ${ns.join(", ")})</i>` : "";
  };

  const filasNc = plan
    .map((p, i) => `<tr><td class="c">${i + 1}</td><td>${p.codigo}</td><td>${esc(p.item)}</td><td class="${p.criticidad === "Crítico" ? "crit" : ""}">${p.criticidad}</td><td>${esc(p.hallazgo)}${evRef(p.codigo)}</td><td class="c">${fecha(p.fechaLimite)}</td></tr>`)
    .join("");

  const filasEv = filasEvidencias(
    evidencias.map((x) => ({
      n: x.n,
      b64: fotos[x.uri],
      descripcion: `${x.codigo} – ${esc(items.get(x.codigo)?.criterio ?? "")}${x.hallazgo ? ` ${esc(x.hallazgo)}` : ""}`,
    })),
  );

  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
${cabecera("CONTROL OPERACIONAL DE CONTRATISTAS", `SST-FO-070 ${SST_FO_070_VERSION} – Verificación técnica en campo`)}

<div class="bar">1. INFORMACIÓN GENERAL</div>
<table>
<tr><td class="lbl">Proyecto / frente</td><td colspan="3">${esc(e.proyecto)}</td></tr>
<tr><td class="lbl">Contratista</td><td>${esc(e.contratista)}</td><td class="lbl">Ubicación</td><td>${esc(e.ubicacion)}</td></tr>
<tr><td class="lbl">Fecha de verificación</td><td>${fecha(e.fecha)}</td><td class="lbl">Hora</td><td>${esc(e.hora)}</td></tr>
<tr><td class="lbl">N° de trabajadores</td><td>${esc(e.trabajadores)}</td><td class="lbl">Responsable SST contratista</td><td>${esc(e.responsableContratista)}</td></tr>
<tr><td class="lbl">Verificado por (SST OINAC)</td><td colspan="3">${esc(e.verificadoPor)}</td></tr>
<tr><td class="lbl">Actividades críticas en ejecución</td><td colspan="3">${esc(e.actividadesTexto) || activos.filter((b) => !b.siempre).map((b) => esc(b.titulo)).join("; ") || "Ninguna"}</td></tr>
</table>

<div class="bar">2. RESULTADO DE LA VERIFICACIÓN</div>
<table><tr><th>Bloque</th><th class="c">C</th><th class="c">NC</th><th class="c">NA</th><th class="c">% cumplimiento</th></tr>
${filasBloques}
<tr><td><b>TOTAL</b></td><td class="c"><b>${r.total.c}</b></td><td class="c"><b>${r.total.nc}</b></td><td class="c"><b>${r.total.na}</b></td><td class="c"><b>${pct(r.total.cumplimiento)}</b></td></tr></table>
${noActivos.length ? `<p><i>No aplican en este frente (marcados NA): ${esc(noActivos.join("; "))}.</i></p>` : ""}
<table>
<tr><td class="lbl">NC críticas / mayores / menores</td><td>${r.ncPorCriticidad["Crítico"]} / ${r.ncPorCriticidad.Mayor} / ${r.ncPorCriticidad.Menor}</td></tr>
<tr><td class="lbl">Calificación</td><td>${r.calificacion ?? "No evaluado"}</td></tr>
<tr><td class="lbl">¿La actividad puede continuar?</td><td class="dec ${r.ncPorCriticidad["Crítico"] ? "crit" : ""}">${esc(r.decision)}</td></tr>
</table>

<div class="bar">3. NO CONFORMIDADES Y PLAN DE ACCIÓN</div>
${plan.length ? `<table><tr><th class="c">N°</th><th>Código</th><th>Ítem no conforme</th><th>Criticidad</th><th>Hallazgo</th><th>Fecha límite</th></tr>${filasNc}</table>` : "<p>No se registraron no conformidades.</p>"}

<div class="bar">4. ACCIONES TOMADAS EN SITIO</div>
<p>${esc(ins.accionesEnSitio) || "Ninguna registrada."}</p>

<div class="bar">5. FIRMAS</div>
<table><tr>${celdaFirma(ins.firmas?.oinac, "Profesional SST OINAC", e.verificadoPor)}${celdaFirma(ins.firmas?.contratista, "Profesional SST contratista", e.responsableContratista)}</tr></table>

<div class="bar">6. REFERENCIAS NORMATIVAS</div>
<ul>${REFERENCIAS.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>

${evidencias.length ? `<div class="bar" style="page-break-before:always">7. ANEXO – EVIDENCIA FOTOGRÁFICA</div><table class="ev">${filasEv}</table>` : ""}
</body></html>`;
}

export function nombreArchivoInforme(ins: InspeccionFrente): string {
  return `SST-FO-070_${limpio(ins.encabezado.contratista) || "Contratista"}_${ins.encabezado.fecha}.pdf`;
}

export { esc } from "./informeComun";
