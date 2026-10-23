// Cálculos del SST-FO-070: resultado por bloque, calificación, decisión y plan de acción.
import type {
  BloqueVerificacion,
  Criticidad,
  EstadoAccion,
  ParametrosOinac,
  RespuestaRegistrada,
} from "./tipos";
import { PARAMETROS_POR_DEFECTO } from "./tipos";

export type Respuestas = Record<string, RespuestaRegistrada | undefined>;

export interface ResultadoBloque {
  numero: number;
  titulo: string;
  c: number;
  nc: number;
  na: number;
  /** C / (C + NC); null si no hay ítems evaluados. */
  cumplimiento: number | null;
}

export type Calificacion = "CUMPLE" | "CUMPLE PARCIALMENTE" | "NO CUMPLE";

export interface ResultadoVerificacion {
  bloques: ResultadoBloque[];
  total: Omit<ResultadoBloque, "numero" | "titulo">;
  sinDiligenciar: number;
  ncPorCriticidad: Record<Criticidad, number>;
  calificacion: Calificacion | null;
  decision: string;
}

/** Bloques activos: los que aplican siempre más los de las actividades críticas marcadas. */
export function bloquesActivos(bloques: BloqueVerificacion[], prefijosActividad: string[]): BloqueVerificacion[] {
  const sel = new Set(prefijosActividad);
  return bloques.filter((b) => b.siempre || sel.has(b.prefijo));
}

/** Respuestas con NA en todos los ítems de los bloques no activos. */
export function marcarNoAplica(bloques: BloqueVerificacion[], activos: BloqueVerificacion[], respuestas: Respuestas): Respuestas {
  const activosSet = new Set(activos.map((b) => b.numero));
  const out: Respuestas = { ...respuestas };
  for (const b of bloques) {
    if (activosSet.has(b.numero)) continue;
    for (const it of b.items) out[it.codigo] = { resultado: "NA" };
  }
  return out;
}

const pct = (c: number, nc: number) => (c + nc ? c / (c + nc) : null);

export function calcularResultado(
  bloques: BloqueVerificacion[],
  respuestas: Respuestas,
  params: ParametrosOinac = PARAMETROS_POR_DEFECTO,
): ResultadoVerificacion {
  const ncPorCriticidad: Record<Criticidad, number> = { "Crítico": 0, Mayor: 0, Menor: 0 };
  let sinDiligenciar = 0;
  const res: ResultadoBloque[] = bloques.map((b) => {
    let c = 0, nc = 0, na = 0;
    for (const it of b.items) {
      const r = respuestas[it.codigo]?.resultado;
      if (r === "C") c++;
      else if (r === "NC") { nc++; ncPorCriticidad[it.criticidad]++; }
      else if (r === "NA") na++;
      else sinDiligenciar++;
    }
    return { numero: b.numero, titulo: b.titulo, c, nc, na, cumplimiento: pct(c, nc) };
  });
  const c = res.reduce((s, b) => s + b.c, 0);
  const nc = res.reduce((s, b) => s + b.nc, 0);
  const na = res.reduce((s, b) => s + b.na, 0);
  const cumplimiento = pct(c, nc);

  let calificacion: Calificacion | null = null;
  if (cumplimiento !== null) {
    calificacion = cumplimiento >= params.umbralCumple ? "CUMPLE"
      : cumplimiento >= params.umbralCumpleParcial ? "CUMPLE PARCIALMENTE" : "NO CUMPLE";
  }

  // Misma regla que la celda «¿La actividad puede continuar?» del Excel.
  const decision = sinDiligenciar ? "INSPECCIÓN INCOMPLETA – faltan ítems por marcar"
    : ncPorCriticidad["Crítico"] ? "NO – detener las tareas con NC crítica hasta su corrección"
    : "SÍ – la actividad puede continuar";

  return { bloques: res, total: { c, nc, na, cumplimiento }, sinDiligenciar, ncPorCriticidad, calificacion, decision };
}

export interface AccionPlan {
  codigo: string;
  bloque: string;
  item: string;
  criticidad: Criticidad;
  hallazgo: string;
  accionCorrectiva?: string;
  responsable?: string;
  /** Fechas en formato AAAA-MM-DD. */
  fechaLimite: string;
  fechaCierre?: string;
  evidenciaCierre?: string;
  verificoCierre?: string;
}

export function sumarDias(fechaIso: string, dias: number): string {
  const [y, m, d] = fechaIso.split("-").map(Number);
  const f = new Date(Date.UTC(y, m - 1, d + dias));
  return f.toISOString().slice(0, 10);
}

/** Una fila del plan de acción por cada NC, con la fecha límite según la criticidad. */
export function generarPlanAccion(
  bloques: BloqueVerificacion[],
  respuestas: Respuestas,
  fechaVerificacion: string,
  params: ParametrosOinac = PARAMETROS_POR_DEFECTO,
): AccionPlan[] {
  const plan: AccionPlan[] = [];
  for (const b of bloques) {
    for (const it of b.items) {
      const r = respuestas[it.codigo];
      if (r?.resultado !== "NC") continue;
      plan.push({
        codigo: it.codigo,
        bloque: `${b.numero}. ${b.titulo}`,
        item: it.criterio,
        criticidad: it.criticidad,
        hallazgo: r.observacion ?? "",
        fechaLimite: sumarDias(fechaVerificacion, params.plazoDias[it.criticidad]),
      });
    }
  }
  return plan;
}

const diasEntre = (a: string, b: string) =>
  Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);

export function estadoAccion(a: AccionPlan, hoy: string): { estado: EstadoAccion; diasAtraso: number } {
  // Igual que la hoja «Plan de acción»: los días de atraso solo cuentan mientras está vencida.
  if (a.fechaCierre) return { estado: "Cerrado", diasAtraso: 0 };
  const atraso = diasEntre(a.fechaLimite, hoy);
  return atraso > 0 ? { estado: "Vencido", diasAtraso: atraso } : { estado: "Abierto", diasAtraso: 0 };
}
