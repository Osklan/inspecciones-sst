// Registro de una inspección guardada en el teléfono.
import type { Respuestas } from "./controlOperacional";
import type { Firma } from "./firma";
import { LISTAS_LOCATIVAS } from "../data/listasLocativas";
import { categoria, copiarSecciones, nuevoEquipo, objetivoEquipos, type InspeccionEquipos } from "./equipos";
import { listaDe, nuevoPunto, objetivoPorDefecto, type InspeccionLocativa } from "./locativas";
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

export type Inspeccion = InspeccionFrente | InspeccionLocativa | InspeccionEquipos;

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

export function nuevaInspeccionLocativa(listaId = LISTAS_LOCATIVAS[0].id, anterior?: InspeccionLocativa, ahora = new Date()): InspeccionLocativa {
  const id = nuevoId(ahora.getTime());
  const lista = listaDe({ listaId });
  return {
    id,
    tipo: "locativas",
    creado: ahora.getTime(),
    actualizado: ahora.getTime(),
    listaId,
    encabezado: {
      proyecto: anterior?.encabezado.proyecto ?? PROYECTO_POR_DEFECTO,
      tipoInspeccion: "Planeada",
      fecha: fechaIso(ahora),
      area: "",
      responsableArea: "",
      elaboradoPor: anterior?.encabezado.elaboradoPor ?? "",
      cargoElaboro: anterior?.encabezado.cargoElaboro ?? "Profesional SST",
      revisadoPor: anterior?.encabezado.revisadoPor ?? "",
      cargoReviso: anterior?.encabezado.cargoReviso ?? "Coordinador SST",
    },
    objetivo: objetivoPorDefecto(lista),
    puntos: [nuevoPunto(`${id}-1`)],
    resultados: "",
    conclusiones: "",
    recomendaciones: "",
  };
}

/**
 * @param categorias Categorías a inspeccionar. Si hay una inspección anterior y `copiar` es true,
 * se parte de sus equipos (sin resultados) para las categorías que coincidan.
 */
export function nuevaInspeccionEquipos(categorias: string[], anterior?: InspeccionEquipos, copiar = true, ahora = new Date()): InspeccionEquipos {
  const id = nuevoId(ahora.getTime());
  const previas = copiar && anterior ? copiarSecciones(anterior.secciones.filter((s) => categorias.includes(s.categoriaId)), id) : [];
  const secciones = categorias.map(
    (c, k) => previas.find((s) => s.categoriaId === c) ?? { categoriaId: c, texto: "", laboratorio: "", equipos: [nuevoEquipo(`${id}-n${k}`, categoria(c))] },
  );
  return {
    id,
    tipo: "equipos",
    creado: ahora.getTime(),
    actualizado: ahora.getTime(),
    encabezado: {
      proyecto: anterior?.encabezado.proyecto ?? PROYECTO_POR_DEFECTO,
      tipoInspeccion: anterior?.encabezado.tipoInspeccion ?? "Planeada – Mensual",
      fecha: fechaIso(ahora),
      area: anterior?.encabezado.area ?? "",
      responsableArea: anterior?.encabezado.responsableArea ?? "",
      elaboradoPor: anterior?.encabezado.elaboradoPor ?? "",
      cargoElaboro: anterior?.encabezado.cargoElaboro ?? "Profesional SST",
      revisadoPor: anterior?.encabezado.revisadoPor ?? "",
      cargoReviso: anterior?.encabezado.cargoReviso ?? "Coordinador SST",
    },
    objetivo: objetivoEquipos(secciones),
    secciones,
    conclusiones: "",
    recomendaciones: "",
  };
}

export function tituloInspeccion(i: Inspeccion): string {
  if (i.tipo === "equipos") return ["Equipos y EPP", i.encabezado.area].filter(Boolean).join(" – ");
  if (i.tipo === "locativas") return [listaDe(i).nombre, i.encabezado.area].filter(Boolean).join(" – ");
  const e = i.encabezado;
  return [e.contratista || "Sin contratista", e.ubicacion].filter(Boolean).join(" – ");
}

export const ETIQUETA_TIPO: Record<TipoInspeccion, string> = {
  frentes: "Frente de trabajo",
  equipos: "Equipos y EPP",
  locativas: "Condiciones locativas",
};
