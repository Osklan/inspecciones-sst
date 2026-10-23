// Firma dibujada en pantalla, guardada como trazos vectoriales (SVG).

export interface Firma {
  /** Trazos en formato de atributo `d` de SVG. */
  trazos: string[];
  ancho: number;
  alto: number;
  /** Momento de la firma (ms). */
  fecha: number;
}

export type Punto = { x: number; y: number };

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Convierte una lista de puntos en un trazo SVG (M x y L x y …). */
export function trazoDesdePuntos(puntos: Punto[]): string {
  if (!puntos.length) return "";
  const [p0, ...resto] = puntos;
  // Un toque sin movimiento se dibuja como un punto.
  if (!resto.length) return `M${r1(p0.x)} ${r1(p0.y)} l0.1 0`;
  return `M${r1(p0.x)} ${r1(p0.y)}` + resto.map((p) => ` L${r1(p.x)} ${r1(p.y)}`).join("");
}

export const firmaVacia = (f?: Firma | null) => !f || f.trazos.length === 0;

/** SVG autónomo de la firma, para incrustarlo en el informe. */
export function firmaSvg(f: Firma, altoMax = 60): string {
  const paths = f.trazos.map((d) => `<path d="${d.replace(/[^0-9MLl. -]/g, "")}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f.ancho} ${f.alto}" style="height:${altoMax}px;max-width:100%" fill="none" stroke="#0B2A5B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}
