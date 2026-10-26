// Inspección de herramientas, equipos y EPP (contra caídas, LOTO, equipos dieléctricos…).
// Sigue los informes mensuales de OINAC: una sección por categoría, cada equipo con su
// resultado Apto / No apto / En prueba, y los que no son aptos pasan a hallazgos.
import { CATEGORIAS_EQUIPOS, type CategoriaEquipo } from "../data/categoriasEquipos";
import type { Firma } from "./firma";
import type { EncabezadoLocativa } from "./locativas";
import type { RespuestaItem, ResultadoEquipo } from "./tipos";

export type EstadoHallazgo = "Abierto" | "En proceso" | "Cerrado";

export interface Equipo {
  id: string;
  /** Titular, asignado a, o N° de kit según la categoría. */
  titular: string;
  /** Elemento o equipo: «Arnés de cuerpo completo», «Traje Veratti FR AR 40 cal/cm²». */
  elemento: string;
  marca: string;
  serial: string;
  condicion: string;
  /** Última prueba o inspección anual, AAAA-MM-DD; vacío si no está registrada. */
  fechaPrueba: string;
  codigoPrueba: string;
  /** Componentes presentes del kit, por índice (solo formato «kit»). */
  componentes?: Record<number, boolean>;
  /** Lista de verificación: C / NC / NA por índice del aspecto de la categoría. */
  aspectos?: Record<number, RespuestaItem | undefined>;
  resultado?: ResultadoEquipo;
  /** Para los equipos que no son aptos o están en prueba. */
  hallazgo: string;
  riesgo: string;
  accion: string;
  estado: EstadoHallazgo;
  fotos: string[];
}

export interface SeccionEquipos {
  categoriaId: string;
  /** Texto de resultados de la sección. */
  texto: string;
  /** Laboratorio de las pruebas (formato «certificado»), p. ej. Testlab SAS. */
  laboratorio: string;
  equipos: Equipo[];
}

export type RolFirmante = "Propietario del EPP" | "Responsable presente";

/** Firma de quien recibe la inspección: el dueño de su EPP o quien estuvo presente en la de los equipos de uso común. */
export interface Firmante {
  id: string;
  nombre: string;
  rol: RolFirmante;
  firma?: Firma;
}

export interface InspeccionEquipos {
  id: string;
  tipo: "equipos";
  creado: number;
  actualizado: number;
  encabezado: EncabezadoLocativa;
  objetivo: string;
  secciones: SeccionEquipos[];
  conclusiones: string;
  recomendaciones: string;
  firmas?: { elaboro?: Firma; reviso?: Firma };
  firmantes?: Firmante[];
}

export function categoria(id: string): CategoriaEquipo {
  return CATEGORIAS_EQUIPOS.find((c) => c.id === id) ?? CATEGORIAS_EQUIPOS[0];
}

export function nuevoEquipo(id: string, cat?: CategoriaEquipo): Equipo {
  return {
    id, titular: "", elemento: "", marca: "", serial: "", condicion: "", fechaPrueba: "", codigoPrueba: "",
    componentes: cat?.formato === "kit" ? Object.fromEntries((cat.componentes ?? []).map((_, i) => [i, true])) : undefined,
    hallazgo: "", riesgo: "", accion: "", estado: "Abierto", fotos: [],
  };
}

/** Copia los equipos de la inspección anterior sin resultados, condiciones ni fotos. */
export function copiarSecciones(anteriores: SeccionEquipos[], prefijoId: string): SeccionEquipos[] {
  let n = 0;
  return anteriores.map((s) => ({
    categoriaId: s.categoriaId,
    texto: "",
    laboratorio: s.laboratorio,
    equipos: s.equipos.map((e) => ({
      ...nuevoEquipo(`${prefijoId}-${++n}`, categoria(s.categoriaId)),
      titular: e.titular, elemento: e.elemento, marca: e.marca, serial: e.serial,
      fechaPrueba: e.fechaPrueba, codigoPrueba: e.codigoPrueba,
    })),
  }));
}

export function objetivoEquipos(secciones: Pick<SeccionEquipos, "categoriaId">[]): string {
  const nombres = secciones.map((s) => categoria(s.categoriaId).nombre.replace(/^./, (c) => c.toLowerCase()));
  const lista = nombres.length > 1 ? `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}` : nombres[0] ?? "los equipos";
  return `Verificar el estado físico, funcional y las condiciones de seguridad de ${lista}, identificando deterioros, daños, faltantes o condiciones que puedan afectar su uso seguro, con el fin de prevenir accidentes de trabajo.`;
}

const dos = (n: number) => String(n).padStart(2, "0");

/** Fecha de vencimiento de la prueba: fecha + meses de vigencia (AAAA-MM-DD). */
export function venceEl(fechaIso: string, meses: number): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fechaIso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1 + meses, Number(m[3]));
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

export type Vigencia = "vigente" | "vencida" | "sin registro" | null;

/** Estado de la prueba o inspección anual a la fecha de la inspección; null si la categoría no la exige. */
export function vigencia(e: Pick<Equipo, "fechaPrueba">, cat: CategoriaEquipo, fechaInspeccion: string): Vigencia {
  if (!cat.vigenciaMeses) return null;
  const v = venceEl(e.fechaPrueba, cat.vigenciaMeses);
  if (!v) return "sin registro";
  return v < fechaInspeccion ? "vencida" : "vigente";
}

/** Componentes del kit que faltan. */
export function faltantes(e: Equipo, cat: CategoriaEquipo): string[] {
  return (cat.componentes ?? []).filter((_, i) => e.componentes?.[i] === false);
}

export interface HallazgoEquipo {
  seccion: SeccionEquipos;
  equipo: Equipo;
  /** Texto del hallazgo: el escrito en la app o uno armado con los datos del equipo. */
  texto: string;
}

export const nombreEquipo = (e: Pick<Equipo, "titular" | "elemento">) => [e.elemento, e.titular].filter((x) => x.trim()).join(" – ");

export interface ResultadoEquipos {
  total: number;
  porResultado: Record<ResultadoEquipo, number>;
  sinResultado: number;
  vencidas: number;
  hallazgos: HallazgoEquipo[];
  resumen: string;
}

export function calcularEquipos(ins: InspeccionEquipos): ResultadoEquipos {
  const porResultado: Record<ResultadoEquipo, number> = { Apto: 0, "No apto": 0, "En prueba": 0 };
  let total = 0, sinResultado = 0, vencidas = 0;
  const hallazgos: HallazgoEquipo[] = [];
  for (const s of ins.secciones) {
    const cat = categoria(s.categoriaId);
    for (const e of s.equipos) {
      total++;
      if (e.resultado) porResultado[e.resultado]++;
      else sinResultado++;
      if (vigencia(e, cat, ins.encabezado.fecha) === "vencida") vencidas++;
      if (e.resultado && e.resultado !== "Apto") {
        const falta = faltantes(e, cat);
        const auto = cat.formato === "kit" && falta.length
          ? `Al kit de ${e.titular || "un trabajador"} le faltan: ${falta.join(", ")}.`
          : `${nombreEquipo(e) || "Equipo"}: ${e.condicion.trim() || e.resultado.toLowerCase()}.`;
        hallazgos.push({ seccion: s, equipo: e, texto: e.hallazgo.trim() || auto });
      }
    }
  }
  const noAptos = hallazgos.map((h) => `${nombreEquipo(h.equipo) || "equipo"} ${h.equipo.resultado!.toLowerCase()}`);
  const resumen = hallazgos.length
    ? `Con hallazgos – ${noAptos.join("; ")}`
    : `Sin hallazgos – ${total} ${total === 1 ? "equipo apto" : "equipos aptos"}`;
  return { total, porResultado, sinResultado, vencidas, hallazgos, resumen };
}

/** Formatos en los que cada equipo tiene un dueño; en los demás el equipo es de uso común. */
const PERSONALES = new Set(["inventario", "kit", "certificado"]);

/**
 * Firmantes que pide la inspección: un propietario por cada titular de EPP personal y, si hay
 * equipos de uso común, al menos un responsable presente. Conserva las firmas ya tomadas.
 */
export function firmantesDe(ins: InspeccionEquipos): Firmante[] {
  const guardados = ins.firmantes ?? [];
  const clave = (n: string) => n.trim().toLowerCase();
  const titulares = new Map<string, string>();
  let comun = false;
  for (const s of ins.secciones) {
    const cat = categoria(s.categoriaId);
    if (!PERSONALES.has(cat.formato)) comun ||= s.equipos.length > 0;
    else for (const e of s.equipos) if (e.titular.trim() && !titulares.has(clave(e.titular))) titulares.set(clave(e.titular), e.titular.trim());
  }
  const propietarios = [...titulares].map(([k, nombre]) => {
    const g = guardados.find((f) => f.rol === "Propietario del EPP" && clave(f.nombre) === k);
    return g ? { ...g, nombre } : { id: `prop-${k}`, nombre, rol: "Propietario del EPP" as const };
  });
  const presentes = guardados.filter((f) => f.rol === "Responsable presente");
  if (comun && !presentes.length) presentes.push({ id: "presente-1", nombre: "", rol: "Responsable presente" });
  return [...propietarios, ...presentes];
}

/** Aspectos de la lista de verificación sin marcar, sumando todos los equipos. */
export function aspectosSinMarcar(ins: InspeccionEquipos): number {
  let n = 0;
  for (const s of ins.secciones) {
    const total = categoria(s.categoriaId).aspectos.length;
    for (const e of s.equipos) for (let i = 0; i < total; i++) if (!e.aspectos?.[i]) n++;
  }
  return n;
}
