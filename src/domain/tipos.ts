// Modelo de datos de la app de inspecciones SST.

export type TipoInspeccion = "frentes" | "equipos" | "locativas" | "botiquines";

export const TIPOS_INSPECCION: Record<TipoInspeccion, string> = {
  frentes: "Frentes de trabajo",
  equipos: "Herramientas, equipos y EPP",
  locativas: "Condiciones locativas",
  botiquines: "Botiquines",
};

export type Criticidad = "Crítico" | "Mayor" | "Menor";

/** C = cumple, NC = no cumple, NA = no aplica (SST-FO-070). */
export type RespuestaItem = "C" | "NC" | "NA";

export interface ItemVerificacion {
  codigo: string;
  criterio: string;
  criticidad: Criticidad;
  evidencia: string;
}

export interface BloqueVerificacion {
  numero: number;
  titulo: string;
  prefijo: string;
  /** El bloque aplica a todos los frentes; los demás se activan por actividad crítica. */
  siempre: boolean;
  items: ItemVerificacion[];
}

export interface RespuestaRegistrada {
  resultado: RespuestaItem;
  /** Obligatoria cuando el resultado es NC: qué se encontró, dónde y quién. */
  observacion?: string;
  fotos?: string[];
}

/** Resultado de un equipo en la inspección de equipos y EPP. */
export type ResultadoEquipo = "Apto" | "No apto" | "En prueba";

export type EstadoAccion = "Abierto" | "Vencido" | "Cerrado";

export interface ParametrosOinac {
  /** Días para cerrar una NC según su criticidad. */
  plazoDias: Record<Criticidad, number>;
  /** Umbrales de calificación (fracción 0–1). */
  umbralCumple: number;
  umbralCumpleParcial: number;
}

export const PARAMETROS_POR_DEFECTO: ParametrosOinac = {
  plazoDias: { "Crítico": 0, Mayor: 1, Menor: 5 },
  umbralCumple: 0.9,
  umbralCumpleParcial: 0.75,
};
