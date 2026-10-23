// Registro de una inspección guardada en el teléfono.
import type { Respuestas } from "./controlOperacional";
import type { Firma } from "./firma";
import type { TipoInspeccion } from "./tipos";

export interface EncabezadoFrente {
  proyecto: string;
  contratista: string;
  ubicacion: string;
  trabajadores: string;
  /** AAAA-MM-DD */
  fecha: string;
  /** HH:MM */
  hora: string;
  responsableContratista: string;
  verificadoPor: string;
  actividadesTexto: string;
}

export interface InspeccionFrente {
  id: string;
  tipo: "frentes";
  creado: number;
  actualizado: number;
  encabezado: EncabezadoFrente;
  /** Prefijos de los bloques activados por actividad crítica (ALD, ELE, IZA…). */
  actividadesCriticas: string[];
  respuestas: Respuestas;
  accionesEnSitio: string;
  firmas?: { oinac?: Firma; contratista?: Firma };
}

export type Inspeccion = InspeccionFrente;

export const PROYECTO_POR_DEFECTO = "Ampliación y modernización Aeropuerto Internacional Rafael Núñez";

const dos = (n: number) => String(n).padStart(2, "0");

export function fechaIso(d: Date): string {
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

export function nuevoId(ahora = Date.now()): string {
  return ahora.toString(36) + Math.random().toString(36).slice(2, 8);
}

export function nuevaInspeccionFrente(anterior?: InspeccionFrente, ahora = new Date()): InspeccionFrente {
  return {
    id: nuevoId(ahora.getTime()),
    tipo: "frentes",
    creado: ahora.getTime(),
    actualizado: ahora.getTime(),
    encabezado: {
      proyecto: anterior?.encabezado.proyecto ?? PROYECTO_POR_DEFECTO,
      contratista: "",
      ubicacion: "",
      trabajadores: "",
      fecha: fechaIso(ahora),
      hora: `${dos(ahora.getHours())}:${dos(ahora.getMinutes())}`,
      responsableContratista: "",
      verificadoPor: anterior?.encabezado.verificadoPor ?? "",
      actividadesTexto: "",
    },
    actividadesCriticas: [],
    respuestas: {},
    accionesEnSitio: "",
  };
}

export function tituloInspeccion(i: Inspeccion): string {
  const e = i.encabezado;
  return [e.contratista || "Sin contratista", e.ubicacion].filter(Boolean).join(" – ");
}

export const ETIQUETA_TIPO: Record<TipoInspeccion, string> = {
  frentes: "Frente de trabajo",
  equipos: "Equipos y EPP",
  locativas: "Condiciones locativas",
};
