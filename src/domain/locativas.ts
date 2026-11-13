// Inspección de condiciones locativas (baños, cocinas, cuartos técnicos, almacenamiento).
// Sigue el formato del informe de baños de contratistas CCNC: se recorren varios puntos
// (frentes, sedes), en cada uno se verifican los aspectos de la lista y cada punto con
// algún "No cumple" se vuelve un hallazgo con su riesgo, acción recomendada y fotos.
import { LISTAS_LOCATIVAS, type ListaLocativa } from "../data/listasLocativas";
import type { Calificacion } from "./controlOperacional";
import type { Firma } from "./firma";
import { PARAMETROS_POR_DEFECTO, type ParametrosOinac, type RespuestaItem } from "./tipos";

export interface PuntoLocativo {
  id: string;
  /** Frente, sede o ubicación: «Contratista LEGGO – antiguo parqueadero nacional». */
  nombre: string;
  /** Respuesta por índice del aspecto en la lista. */
  respuestas: Record<number, RespuestaItem | undefined>;
  /** Observación por aspecto (columna OBSERVACIONES de la lista de verificación). */
  observaciones?: Record<number, string>;
  /** Descripción del hallazgo: qué se encontró. */
  hallazgo: string;
  riesgo: string;
  accion: string;
  fotos: string[];
  /** Datos del punto que pide la lista (`camposPunto`), por id. */
  campos?: Record<string, string>;
  /** Firmas del punto que pide la lista (`firmasPunto`), por id. */
  firmas?: Record<string, Firma | undefined>;
}

export interface EncabezadoLocativa {
  proyecto: string;
  tipoInspeccion: string;
  /** AAAA-MM-DD */
  fecha: string;
  area: string;
  responsableArea: string;
  elaboradoPor: string;
  cargoElaboro: string;
  revisadoPor: string;
  cargoReviso: string;
}

export interface InspeccionLocativa {
  id: string;
  tipo: "locativas";
  creado: number;
  actualizado: number;
  listaId: string;
  encabezado: EncabezadoLocativa;
  objetivo: string;
  puntos: PuntoLocativo[];
  resultados: string;
  conclusiones: string;
  recomendaciones: string;
  /** `reviso` queda de versiones anteriores: ya no se pide ni se imprime. */
  firmas?: { elaboro?: Firma; reviso?: Firma; responsable?: Firma };
  /** Fotos de la visita, aunque no haya hallazgos; salen al final del anexo fotográfico. */
  fotosVisita?: string[];
}

export function listaDe(ins: Pick<InspeccionLocativa, "listaId">): ListaLocativa {
  return LISTAS_LOCATIVAS.find((l) => l.id === ins.listaId) ?? LISTAS_LOCATIVAS[0];
}

export function objetivoPorDefecto(lista: ListaLocativa): string {
  if (lista.objetivo) return lista.objetivo;
  return `Identificar las condiciones de ${lista.nombre.toLowerCase()} de los puntos inspeccionados, verificando ${lista.aspectos
    .map((a) => a.replace(/\.$/, "").replace(/^./, (c) => c.toLowerCase()))
    .slice(0, 3)
    .join("; ")}, entre otros aspectos, con el fin de prevenir la exposición del personal a riesgos y garantizar condiciones dignas de trabajo.`;
}

export function nuevoPunto(id: string): PuntoLocativo {
  return { id, nombre: "", respuestas: {}, hallazgo: "", riesgo: "", accion: "", fotos: [] };
}

export interface ResultadoPunto {
  c: number;
  nc: number;
  na: number;
  sinMarcar: number;
  cumplimiento: number | null;
}

export function resultadoPunto(p: PuntoLocativo, lista: ListaLocativa): ResultadoPunto {
  let c = 0, nc = 0, na = 0;
  lista.aspectos.forEach((_, i) => {
    const r = p.respuestas[i];
    if (r === "C") c++;
    else if (r === "NC") nc++;
    else if (r === "NA") na++;
  });
  return { c, nc, na, sinMarcar: lista.aspectos.length - c - nc - na, cumplimiento: c + nc ? c / (c + nc) : null };
}

export interface ResultadoLocativa {
  puntos: ResultadoPunto[];
  /** Conteo C/NC/NA por aspecto, sumando todos los puntos. */
  aspectos: { c: number; nc: number; na: number }[];
  total: ResultadoPunto;
  /** Puntos con al menos un NC, en orden: son los hallazgos del informe. */
  conHallazgo: PuntoLocativo[];
  calificacion: Calificacion | null;
  resumen: string;
}

export function calcularLocativa(ins: InspeccionLocativa, params: ParametrosOinac = PARAMETROS_POR_DEFECTO): ResultadoLocativa {
  const lista = listaDe(ins);
  const puntos = ins.puntos.map((p) => resultadoPunto(p, lista));
  const aspectos = lista.aspectos.map((_, i) => {
    const x = { c: 0, nc: 0, na: 0 };
    for (const p of ins.puntos) {
      const r = p.respuestas[i];
      if (r === "C") x.c++;
      else if (r === "NC") x.nc++;
      else if (r === "NA") x.na++;
    }
    return x;
  });
  const sum = (k: "c" | "nc" | "na" | "sinMarcar") => puntos.reduce((s, p) => s + p[k], 0);
  const c = sum("c"), nc = sum("nc");
  const total = { c, nc, na: sum("na"), sinMarcar: sum("sinMarcar"), cumplimiento: c + nc ? c / (c + nc) : null };
  const conHallazgo = ins.puntos.filter((_, i) => puntos[i].nc > 0);
  const calificacion = total.cumplimiento === null ? null
    : total.cumplimiento >= params.umbralCumple ? "CUMPLE"
    : total.cumplimiento >= params.umbralCumpleParcial ? "CUMPLE PARCIALMENTE"
    : "NO CUMPLE";
  const n = ins.puntos.length;
  const resumen = conHallazgo.length
    ? `Con hallazgos – ${conHallazgo.length} ${conHallazgo.length === 1 ? "hallazgo" : "hallazgos"} en ${n} ${n === 1 ? "punto inspeccionado" : "puntos inspeccionados"}`
    : `Sin hallazgos – ${n} ${n === 1 ? "punto inspeccionado" : "puntos inspeccionados"}`;
  return { puntos, aspectos, total, conHallazgo, calificacion, resumen };
}

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

/** «Octubre/2026», como en el campo Período de los informes. */
export function periodo(fechaIso: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(fechaIso);
  return m ? `${MESES[Number(m[2]) - 1]}/${m[1]}` : "";
}

/** Subtítulo que empieza en el aspecto `i`, si lo hay. */
export const grupoEn = (lista: ListaLocativa, i: number) => lista.grupos?.find((g) => g.desde === i)?.titulo;

/** Número del aspecto `i` en el formato. */
export const numeroEn = (lista: ListaLocativa, i: number) => lista.numeros?.[i] ?? i + 1;

/** Firmas del punto que pide la lista, con el nombre de quien firma. */
export const firmasDePunto = (lista: ListaLocativa, p: PuntoLocativo) =>
  (lista.firmasPunto ?? []).map((f) => ({ ...f, nombre: f.campo ? p.campos?.[f.campo] ?? "" : "", firma: p.firmas?.[f.id] }));
