// Informe y lista de verificación (formato SST-FO-077) de la inspección de botiquines.
import { ELEMENTOS_BOTIQUIN, SST_FO_077_VERSION } from "../data/botiquin";
import { calcularBotiquines, evaluarBotiquin, type InspeccionBotiquines, type Novedad } from "./botiquines";
import {
  cabecera,
  CSS,
  esc,
  evidenciasVisita,
  fecha,
  filasEvidencias,
  limpio,
  parrafos,
  tablaDatosGenerales,
  tablaFirmas,
  vinetas,
  type CeldaFirma,
} from "./informeComun";
import { periodo } from "./locativas";

const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)} %`);
const nombre = (b: { area: string }, i: number) => b.area.trim() || `Botiquín ${i + 1}`;

/** SST que elabora y revisa, y el responsable de cada botiquín. */
export const firmasBotiquines = (ins: InspeccionBotiquines): CeldaFirma[] => [
  { firma: ins.firmas?.elaboro, cargo: `Inspeccionó – ${ins.encabezado.cargoElaboro}`, nombre: ins.encabezado.elaboradoPor },
  ...ins.botiquines.map((b, i) => ({ firma: b.firma, cargo: `Responsable – ${nombre(b, i)}`, nombre: b.responsable })),
];

/** @param fotos Mapa de URI de foto → contenido JPEG en base64. */
export function informeBotiquinesHtml(ins: InspeccionBotiquines, fotos: Record<string, string> = {}): string {
  const e = ins.encabezado;
  const r = calcularBotiquines(ins);

  let n = 0;
  const evidencias = ins.botiquines.flatMap((b, i) => b.fotos.map((uri) => ({ n: ++n, b, i, uri })));
  const evRef = (id: string) => {
    const ns = evidencias.filter((x) => x.b.id === id).map((x) => x.n);
    return ns.length ? `<br><i>(Ver evidencia${ns.length > 1 ? "s" : ""} N° ${ns.join(", ")})</i>` : "";
  };

  const filasResultado = ins.botiquines
    .map((b, i) => {
      const x = r.botiquines[i];
      return `<tr><td>${esc(nombre(b, i))}</td><td>${esc(b.responsable)}</td><td class="c">${x.conformes} / ${ELEMENTOS_BOTIQUIN.length}</td><td class="c">${x.faltantes}</td><td class="c">${x.malos}</td><td class="c">${x.vencidos}</td><td class="c">${x.porVencer}</td><td class="c">${pct(x.cumplimiento)}</td></tr>`;
    })
    .join("");

  const filasHallazgos = r.conHallazgo
    .map((b, k) => {
      const i = ins.botiquines.indexOf(b);
      const accion = b.accion.trim() || "Reponer los elementos faltantes, retirar y reemplazar los vencidos o en mal estado.";
      return `<tr><td class="c">${k + 1}</td><td><b>${esc(nombre(b, i))}:</b> ${esc(r.botiquines[i].hallazgo)}${evRef(b.id)}</td><td>${esc(accion)}</td><td>${esc(b.responsable)}</td></tr>`;
    })
    .join("");

  const visita = evidenciasVisita(ins.fotosVisita, n, fotos, e.area, e.fecha);
  const filasEv = filasEvidencias([
    ...evidencias.map((x) => ({ n: x.n, b64: fotos[x.uri], descripcion: `Botiquín – ${esc(nombre(x.b, x.i))}.`, fecha: e.fecha })),
    ...visita,
  ]);

  let sec = 0;
  const bar = (t: string, extra = "") => `<div class="bar"${extra}>${++sec}. ${t}</div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
${cabecera("INFORME DE INSPECCIÓN DE BOTIQUINES")}

${bar("DATOS GENERALES")}
${tablaDatosGenerales(e, periodo(e.fecha), r.resumen)}

${bar("OBJETIVO")}
${parrafos(ins.objetivo)}

${bar("ALCANCE")}
<p>La inspección comprendió los siguientes botiquines:</p>
<ul>${ins.botiquines.map((b, i) => `<li>${esc(nombre(b, i))}${b.responsable ? ` – responsable: ${esc(b.responsable)}` : ""}.</li>`).join("")}</ul>

${bar("METODOLOGÍA")}
<p>Se verificó en cada botiquín la cantidad, el estado y la fecha de vencimiento de los elementos de la dotación mínima del formato ${SST_FO_077_VERSION}: antisépticos, material de curación, e instrumental y otros elementos adicionales. Un elemento es conforme cuando está en la cantidad mínima, en buen estado y vigente. Se avisan como próximos a vencer los que vencen en los 30 días siguientes.</p>

${bar("RESULTADOS DE LA INSPECCIÓN")}
<table><tr><th>Botiquín</th><th>Responsable</th><th class="c">Conformes</th><th class="c">Faltantes</th><th class="c">Mal estado</th><th class="c">Vencidos</th><th class="c">Por vencer</th><th class="c">% cumplimiento</th></tr>${filasResultado}</table>
<p><b>Cumplimiento total:</b> ${pct(r.cumplimiento)}</p>

${bar("HALLAZGOS Y PLAN DE ACCIÓN")}
${r.conHallazgo.length ? `<table><tr><th class="c">N°</th><th style="width:48%">Hallazgo</th><th>Acción recomendada</th><th>Responsable</th></tr>${filasHallazgos}</table>` : "<p>No se registraron hallazgos: los botiquines cuentan con la dotación mínima, en buen estado y vigente.</p>"}

${bar("CONCLUSIONES")}
${vinetas(ins.conclusiones)}

${bar("RECOMENDACIONES")}
${vinetas(ins.recomendaciones)}

${bar("FIRMAS")}
${tablaFirmas(firmasBotiquines(ins))}

${evidencias.length + visita.length ? `${bar("ANEXO – EVIDENCIA FOTOGRÁFICA", ' style="page-break-before:always"')}<table class="ev">${filasEv}</table>` : ""}
</body></html>`;
}

const ETIQUETA_NOVEDAD: Record<Novedad, string> = { falta: "Bajo el mínimo", malo: "Mal estado", vencido: "Vencido", "por vencer": "Próximo a vencer" };

/** Formato SST-FO-077 diligenciado: una hoja por botiquín. */
export function checklistBotiquinesHtml(ins: InspeccionBotiquines): string {
  const e = ins.encabezado;
  const hojas = ins.botiquines
    .map((b, i) => {
      const rb = evaluarBotiquin(b, e.fecha);
      let grupo = "";
      const filas = ELEMENTOS_BOTIQUIN.map((el, k) => {
        const x = b.elementos[k];
        const ev = rb.elementos[k];
        const g = el.grupo !== grupo ? `<tr class="grp"><td colspan="7">${esc(el.grupo.toUpperCase())}</td></tr>` : "";
        grupo = el.grupo;
        const obs = [x?.observacion.trim(), ...ev.novedades.map((n) => ETIQUETA_NOVEDAD[n])].filter(Boolean).join(". ");
        const mal = ev.novedades.some((n) => n !== "por vencer");
        return `${g}<tr><td>${esc(el.contenido)}</td><td class="c">${esc(el.minima)}</td><td class="c${ev.novedades.includes("falta") ? " crit" : ""}">${esc(x?.cantidad ?? "")}</td><td class="c">${x?.estado === "Bueno" ? "X" : ""}</td><td class="c crit">${x?.estado === "Malo" ? "X" : ""}</td><td class="c${ev.novedades.includes("vencido") ? " crit" : ""}">${x?.vence ? fecha(x.vence) : ""}</td><td class="${mal ? "crit" : ""}">${esc(obs)}</td></tr>`;
      }).join("");
      const resultado = b.resultado.trim() || rb.hallazgo || "Botiquín completo, en buen estado y vigente.";
      return `<div${i ? ' style="page-break-before:always"' : ""}>
${cabecera("INSPECCIÓN DE BOTIQUÍN", SST_FO_077_VERSION)}
<table>
<tr><td class="lbl">Inspeccionado por</td><td>${esc(e.elaboradoPor)}</td><td class="lbl">Fecha</td><td>${fecha(e.fecha)}</td></tr>
<tr><td class="lbl">Área</td><td>${esc(nombre(b, i))}</td><td class="lbl">Responsable del botiquín</td><td>${esc(b.responsable)}</td></tr>
</table>
<table class="chk"><tr><th style="width:34%">Elemento esencial / contenido</th><th class="c">Cantidad mínima</th><th class="c">Cantidad encontrada</th><th class="c">Bueno</th><th class="c">Malo</th><th class="c">Fecha de vencimiento</th><th>Observaciones</th></tr>${filas}</table>
<table><tr><td class="lbl">Resultado de inspección</td><td>${esc(resultado)}</td></tr></table>
${tablaFirmas([
  { firma: ins.firmas?.elaboro, cargo: `Inspeccionado por – ${e.cargoElaboro}`, nombre: e.elaboradoPor },
  { firma: b.firma, cargo: "Firma responsable", nombre: b.responsable },
])}
</div>`;
    })
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
.chk td, .chk th { font-size: 9.5px; padding: 3px 4px; }
.grp td { background: #D9E2F3; font-weight: bold; }
</style></head><body>${hojas}</body></html>`;
}

export function nombreArchivoBotiquines(ins: InspeccionBotiquines): string {
  return `Inspeccion_Botiquines${ins.encabezado.area ? `_${limpio(ins.encabezado.area)}` : ""}_${ins.encabezado.fecha}.pdf`;
}
