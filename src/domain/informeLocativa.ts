// HTML del informe de condiciones locativas, con el formato del informe de baños CCNC.
import { calcularLocativa, listaDe, periodo, type InspeccionLocativa } from "./locativas";
import { cabecera, celdaFirma, CSS, esc, fecha, filasEvidencias, limpio } from "./informeComun";

const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)} %`);

/** Párrafos o viñetas: cada línea del texto escrito en la app es un párrafo. */
const parrafos = (s: string) => s.split(/\n+/).map((x) => x.trim()).filter(Boolean);
const lista = (s: string) => {
  const ps = parrafos(s);
  return ps.length ? `<ul>${ps.map((x) => `<li>${esc(x.replace(/^[-•]\s*/, ""))}</li>`).join("")}</ul>` : "<p>—</p>";
};
const texto = (s: string, vacio = "—") => {
  const ps = parrafos(s);
  return ps.length ? ps.map((x) => `<p>${esc(x)}</p>`).join("") : `<p>${vacio}</p>`;
};

/** @param fotos Mapa de URI de foto → contenido JPEG en base64. */
export function informeLocativaHtml(ins: InspeccionLocativa, fotos: Record<string, string> = {}): string {
  const e = ins.encabezado;
  const l = listaDe(ins);
  const r = calcularLocativa(ins);
  const titulo = `INFORME DE INSPECCIÓN DE ${l.nombre.toUpperCase()}${e.area ? ` – ${e.area.toUpperCase()}` : ""}`;

  // Las evidencias se numeran en el orden de los hallazgos.
  let n = 0;
  const evidencias = r.conHallazgo.flatMap((p, h) => p.fotos.map((uri) => ({ n: ++n, h: h + 1, p, uri })));
  const evRef = (id: string) => {
    const ns = evidencias.filter((x) => x.p.id === id).map((x) => x.n);
    return ns.length ? `<br><i>(Ver evidencia${ns.length > 1 ? "s" : ""} N° ${ns.join(", ")})</i>` : "";
  };

  const hallazgoTexto = (p: (typeof r.conHallazgo)[number]) => {
    const nc = l.aspectos.filter((_, i) => p.respuestas[i] === "NC").map((a) => a.replace(/\.$/, ""));
    const base = p.hallazgo.trim() || `No cumple: ${nc.join("; ")}.`;
    return `<b>${esc(p.nombre || "Punto sin nombre")}:</b> ${esc(base)}`;
  };

  const filasPuntos = ins.puntos
    .map((p, i) => {
      const x = r.puntos[i];
      return `<tr><td>${esc(p.nombre || `Punto ${i + 1}`)}</td><td class="c">${x.c}</td><td class="c">${x.nc}</td><td class="c">${x.na}</td><td class="c">${pct(x.cumplimiento)}</td></tr>`;
    })
    .join("");
  const filasAspectos = l.aspectos
    .map((a, i) => `<tr><td>${esc(a)}</td><td class="c">${r.aspectos[i].c}</td><td class="c">${r.aspectos[i].nc}</td><td class="c">${r.aspectos[i].na}</td></tr>`)
    .join("");
  const filasHallazgos = r.conHallazgo
    .map((p, i) => `<tr><td class="c">${i + 1}</td><td>${hallazgoTexto(p)}${evRef(p.id)}</td><td>${esc(p.riesgo)}</td><td>${esc(p.accion)}</td></tr>`)
    .join("");
  const filasNormas = l.normas.map((x) => `<tr><td>${esc(x.aspecto)}</td><td>${esc(x.requisito)}</td><td>${esc(x.fuente)}</td></tr>`).join("");

  const filasEv = filasEvidencias(
    evidencias.map((x) => ({
      n: x.n,
      b64: fotos[x.uri],
      descripcion: `Hallazgo N° ${x.h} – ${esc(x.p.nombre)}.`,
      fecha: e.fecha,
    })),
  );

  let sec = 0;
  const bar = (t: string, extra = "") => `<div class="bar"${extra}>${++sec}. ${t}</div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
${cabecera(esc(titulo), esc(e.proyecto))}

${bar("DATOS GENERALES")}
<table>
<tr><td class="lbl">Tipo de inspección</td><td>${esc(e.tipoInspeccion)}</td><td class="lbl">Período (mes / año)</td><td>${periodo(e.fecha)}</td></tr>
<tr><td class="lbl">Fecha de inspección</td><td>${fecha(e.fecha)}</td><td class="lbl">Sede / Área inspeccionada</td><td>${esc(e.area)}</td></tr>
<tr><td class="lbl">Elaborado por</td><td>${esc(e.elaboradoPor)}</td><td class="lbl">Cargo</td><td>${esc(e.cargoElaboro)}</td></tr>
<tr><td class="lbl">Revisado por</td><td>${esc(e.revisadoPor)}</td><td class="lbl">Cargo</td><td>${esc(e.cargoReviso)}</td></tr>
<tr><td class="lbl">Responsable del área</td><td>${esc(e.responsableArea)}</td><td class="lbl">Resultado general</td><td>${esc(r.resumen)}</td></tr>
</table>

${bar("OBJETIVO")}
${texto(ins.objetivo)}

${bar("ALCANCE")}
<p>La inspección comprendió los siguientes puntos:</p>
<ul>${ins.puntos.map((p, i) => `<li>${esc(p.nombre || `Punto ${i + 1}`)}.</li>`).join("")}</ul>

${bar("METODOLOGÍA")}
<p>La inspección se realizó mediante revisión visual en cada punto, verificando los siguientes aspectos:</p>
<ul>${l.aspectos.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>

${bar("RESULTADOS DE LA INSPECCIÓN")}
${texto(ins.resultados, "")}
<table><tr><th>Punto inspeccionado</th><th class="c">C</th><th class="c">NC</th><th class="c">NA</th><th class="c">% cumplimiento</th></tr>
${filasPuntos}
<tr><td><b>TOTAL</b></td><td class="c"><b>${r.total.c}</b></td><td class="c"><b>${r.total.nc}</b></td><td class="c"><b>${r.total.na}</b></td><td class="c"><b>${pct(r.total.cumplimiento)}</b></td></tr></table>
<table><tr><th>Aspecto verificado</th><th class="c">C</th><th class="c">NC</th><th class="c">NA</th></tr>${filasAspectos}</table>
<p><b>Calificación:</b> ${r.calificacion ?? "No evaluado"}</p>

${bar("HALLAZGOS Y PLAN DE ACCIÓN")}
${r.conHallazgo.length ? `<table><tr><th class="c">N°</th><th style="width:40%">Hallazgo</th><th>Riesgo asociado</th><th>Acción recomendada</th></tr>${filasHallazgos}</table>` : "<p>No se registraron hallazgos.</p>"}

${bar("CONCLUSIONES")}
${lista(ins.conclusiones)}

${bar("RECOMENDACIONES")}
${lista(ins.recomendaciones)}

${l.normas.length ? `${bar("REQUISITOS NORMATIVOS DE REFERENCIA")}<table><tr><th>Aspecto</th><th>Requisito</th><th>Fuente normativa</th></tr>${filasNormas}</table>` : ""}

${bar("FIRMAS")}
<table><tr>${celdaFirma(ins.firmas?.elaboro, `Elaboró – ${e.cargoElaboro}`, e.elaboradoPor)}${celdaFirma(ins.firmas?.reviso, `Revisó – ${e.cargoReviso}`, e.revisadoPor)}</tr></table>

${evidencias.length ? `${bar("ANEXO – EVIDENCIA FOTOGRÁFICA", ' style="page-break-before:always"')}<table class="ev">${filasEv}</table>` : ""}
</body></html>`;
}

export function nombreArchivoLocativa(ins: InspeccionLocativa): string {
  return `Inspeccion_${limpio(listaDe(ins).nombre)}${ins.encabezado.area ? `_${limpio(ins.encabezado.area)}` : ""}_${ins.encabezado.fecha}.pdf`;
}
