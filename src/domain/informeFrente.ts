// HTML del informe del SST-FO-070, con el formato de los informes de OINAC.
// El PDF se genera a partir de este HTML con expo-print.
import { SST_FO_070, SST_FO_070_VERSION } from "../data/sstFo070";
import { LOGO_OINAC_PNG_BASE64 } from "../data/logoOinac";
import { bloquesActivos, calcularResultado, generarPlanAccion, marcarNoAplica } from "./controlOperacional";
import { firmaSvg, firmaVacia, type Firma } from "./firma";
import type { InspeccionFrente } from "./inspeccion";

const celdaFirma = (f: Firma | undefined, cargo: string, nombre: string) =>
  `<td class="firma">${firmaVacia(f) ? "<br><br>" : firmaSvg(f!)}<br>________________________________<br>${cargo}<br>${esc(nombre)}</td>`;

const REFERENCIAS = [
  "Decreto 1072 de 2015 y Resolución 0312 de 2019 (SG-SST y gestión de contratistas).",
  "Resolución 4272 de 2021 (trabajo en alturas).",
  "Resolución 0491 de 2020 (espacios confinados).",
  "RETIE – Reglamento Técnico de Instalaciones Eléctricas.",
  "NFPA 51B (trabajos en caliente) y OSHA 1926 Subparte P (excavaciones), como referencias técnicas complementarias.",
];

export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const fecha = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split("-").reverse().join("/") : iso);
const pct = (x: number | null) => (x === null ? "No evaluado" : `${Math.round(x * 100)} %`);

const CSS = `
@page { size: letter; margin: 18mm 16mm; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5px; color: #000; }
table { width: 100%; border-collapse: collapse; margin: 4px 0; page-break-inside: auto; }
tr { page-break-inside: avoid; }
td, th { border: 1px solid #808080; padding: 4px 6px; vertical-align: top; text-align: left; }
th { background: #153D63; color: #fff; }
.lbl { background: #D9E2F3; font-weight: bold; width: 22%; }
.bar { page-break-after: avoid; background: #1F3864; color: #fff; font-weight: bold; padding: 2px 6px; margin: 14px 0 6px; }
.ttl { color: #1F3864; font-weight: bold; font-size: 15px; text-align: center; vertical-align: middle; }
.c { text-align: center; }
.crit { color: #B42318; font-weight: bold; }
.dec { font-weight: bold; font-size: 12px; }
.ev td { width: 50%; }
.ev .im { text-align: center; height: 200px; vertical-align: middle; }
.ev img { max-height: 190px; max-width: 100%; }
.firma { width: 50%; height: 70px; vertical-align: bottom; text-align: center; }
p { margin: 4px 0; text-align: justify; }
`;

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

  // Dos evidencias por fila, como en el anexo de los informes: título, foto y descripción.
  const celdasEv = evidencias.map((x) => {
    const b64 = fotos[x.uri];
    const img = b64 ? `<img src="data:image/jpeg;base64,${b64}">` : "<i>Foto no disponible</i>";
    return [
      `<td><b>EVIDENCIA N° ${x.n}</b></td>`,
      `<td class="im">${img}</td>`,
      `<td><b>Descripción:</b> ${x.codigo} – ${esc(items.get(x.codigo)?.criterio ?? "")}${x.hallazgo ? ` ${esc(x.hallazgo)}` : ""}</td>`,
    ];
  });
  const vacia = ["<td></td>", "<td></td>", "<td></td>"];
  let filasEv = "";
  for (let i = 0; i < celdasEv.length; i += 2) {
    const a = celdasEv[i], b = celdasEv[i + 1] ?? vacia;
    filasEv += a.map((c, k) => `<tr>${c}${b[k]}</tr>`).join("");
  }

  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<table><tr><td style="width:22%;text-align:center;vertical-align:middle"><img src="data:image/png;base64,${LOGO_OINAC_PNG_BASE64}" style="width:120px"></td>
<td class="ttl">CONTROL OPERACIONAL DE CONTRATISTAS<br><span style="font-size:11px">SST-FO-070 ${SST_FO_070_VERSION} – Verificación técnica en campo</span></td></tr></table>

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
  const limpio = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return `SST-FO-070_${limpio(ins.encabezado.contratista) || "Contratista"}_${ins.encabezado.fecha}.pdf`;
}
