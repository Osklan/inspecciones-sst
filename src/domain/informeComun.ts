// Piezas comunes de los informes en PDF con el formato de OINAC.
import { LOGO_OINAC_PNG_BASE64 } from "../data/logoOinac";
import { firmaSvg, firmaVacia, type Firma } from "./firma";

export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** AAAA-MM-DD → DD/MM/AAAA */
export const fecha = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split("-").reverse().join("/") : iso);

/** Texto apto para nombre de archivo: sin tildes, espacios ni signos. */
export const limpio = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");

export const CSS = `
@page { size: letter; margin: 18mm 16mm; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5px; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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

/** Fila de título con el logo de OINAC. */
export const cabecera = (titulo: string, subtitulo = "") =>
  `<table><tr><td style="width:22%;text-align:center;vertical-align:middle"><img src="data:image/png;base64,${LOGO_OINAC_PNG_BASE64}" style="width:120px"></td>
<td class="ttl">${titulo}${subtitulo ? `<br><span style="font-size:11px">${subtitulo}</span>` : ""}</td></tr></table>`;

export const celdaFirma = (f: Firma | undefined, cargo: string, nombre: string) =>
  `<td class="firma">${firmaVacia(f) ? "<br><br>" : firmaSvg(f!)}<br>________________________________<br>${esc(cargo)}<br>${esc(nombre)}</td>`;

export interface Evidencia {
  n: number;
  /** JPEG en base64; si falta se muestra «Foto no disponible». */
  b64?: string;
  /** HTML ya escapado. */
  descripcion: string;
  fecha?: string;
}

/** Anexo fotográfico: dos evidencias por fila, con título, foto y descripción. */
export function filasEvidencias(evidencias: Evidencia[]): string {
  const celdas = evidencias.map((x) => [
    `<td><b>EVIDENCIA N° ${x.n}</b></td>`,
    `<td class="im">${x.b64 ? `<img src="data:image/jpeg;base64,${x.b64}">` : "<i>Foto no disponible</i>"}</td>`,
    `<td><b>Descripción:</b> ${x.descripcion}${x.fecha ? `<br><b>Fecha:</b> ${fecha(x.fecha)}` : ""}</td>`,
  ]);
  const vacia = ["<td></td>", "<td></td>", "<td></td>"];
  let filas = "";
  for (let i = 0; i < celdas.length; i += 2) {
    const a = celdas[i], b = celdas[i + 1] ?? vacia;
    filas += a.map((c, k) => `<tr>${c}${b[k]}</tr>`).join("");
  }
  return filas;
}

export interface CeldaFirma {
  firma?: Firma;
  cargo: string;
  nombre: string;
}

/** Firmas de dos en dos por fila. */
export function tablaFirmas(firmas: CeldaFirma[]): string {
  let filas = "";
  for (let i = 0; i < firmas.length; i += 2) {
    const [a, b] = [firmas[i], firmas[i + 1]];
    filas += `<tr>${celdaFirma(a.firma, a.cargo, a.nombre)}${b ? celdaFirma(b.firma, b.cargo, b.nombre) : '<td class="firma"></td>'}</tr>`;
  }
  return `<table>${filas}</table>`;
}

/** Encabezado común de los informes de locativas, equipos y botiquines. */
export interface DatosGenerales {
  tipoInspeccion: string;
  fecha: string;
  area: string;
  elaboradoPor: string;
  cargoElaboro: string;
  responsableArea: string;
}

export function tablaDatosGenerales(e: DatosGenerales, periodo: string, resultado: string): string {
  return `<table>
<tr><td class="lbl">Tipo de inspección</td><td>${esc(e.tipoInspeccion)}</td><td class="lbl">Período (mes / año)</td><td>${periodo}</td></tr>
<tr><td class="lbl">Fecha de inspección</td><td>${fecha(e.fecha)}</td><td class="lbl">Sede / Área inspeccionada</td><td>${esc(e.area)}</td></tr>
<tr><td class="lbl">Inspeccionado por</td><td>${esc(e.elaboradoPor)}</td><td class="lbl">Cargo</td><td>${esc(e.cargoElaboro)}</td></tr>
<tr><td class="lbl">Responsable del área</td><td>${esc(e.responsableArea)}</td><td class="lbl">Resultado general</td><td>${esc(resultado)}</td></tr>
</table>`;
}

const parrafosDe = (s: string) => s.split(/\n+/).map((x) => x.trim()).filter(Boolean);

/** Viñetas: cada línea escrita en la app es una. */
export const vinetas = (s: string) => {
  const ps = parrafosDe(s);
  return ps.length ? `<ul>${ps.map((x) => `<li>${esc(x.replace(/^[-•]\s*/, ""))}</li>`).join("")}</ul>` : "<p>—</p>";
};

/** Párrafos: cada línea escrita en la app es uno. */
export const parrafos = (s: string, vacio = "—") => {
  const ps = parrafosDe(s);
  return ps.length ? ps.map((x) => `<p>${esc(x)}</p>`).join("") : vacio ? `<p>${vacio}</p>` : "";
};

/** C / NC / NA en una celda de lista de verificación. */
export const celdaRespuesta = (r?: string) => `<td class="c${r === "NC" ? " crit" : ""}">${r ?? ""}</td>`;
