// Inspección de botiquines con el formato SST-FO-077: por cada botiquín se registra la cantidad
// encontrada, el estado (bueno / malo) y la fecha de vencimiento de cada elemento de la dotación mínima.
import { ELEMENTOS_BOTIQUIN } from "../data/botiquin";
import type { Firma } from "./firma";
import type { EncabezadoLocativa } from "./locativas";

export type EstadoElemento = "Bueno" | "Malo";

export interface RegistroElemento {
  /** Cantidad encontrada, como se escribe en campo («2», «150 ml»). */
  cantidad: string;
  estado?: EstadoElemento;
  /** Fecha de vencimiento AAAA-MM-DD; vacía si el elemento no vence. */
  vence: string;
  observacion: string;
}

export interface Botiquin {
  id: string;
  /** Área o ubicación del botiquín. */
  area: string;
  /** Responsable del botiquín, que firma su lista de verificación. */
  responsable: string;
  elementos: Record<number, RegistroElemento | undefined>;
  /** RESULTADO DE INSPECCIÓN del formato. */
  resultado: string;
  accion: string;
  fotos: string[];
  firma?: Firma;
}

export interface InspeccionBotiquines {
  id: string;
  tipo: "botiquines";
  creado: number;
  actualizado: number;
  encabezado: EncabezadoLocativa;
  objetivo: string;
  botiquines: Botiquin[];
  conclusiones: string;
  recomendaciones: string;
  firmas?: { elaboro?: Firma; reviso?: Firma };
  /** Fotos de la visita, aunque no haya hallazgos; salen al final del anexo fotográfico. */
  fotosVisita?: string[];
}

export const OBJETIVO_BOTIQUINES =
  "Verificar que los botiquines cuenten con la dotación mínima establecida, en buen estado y dentro de su fecha de vencimiento, para garantizar la atención oportuna de primeros auxilios.";

export function nuevoBotiquin(id: string): Botiquin {
  return { id, area: "", responsable: "", elementos: {}, resultado: "", accion: "", fotos: [] };
}

/** Días antes del vencimiento en que se avisa «próximo a vencer». */
export const DIAS_AVISO_VENCIMIENTO = 30;

function sumarDias(fechaIso: string, dias: number): string {
  const [a, m, d] = fechaIso.split("-").map(Number);
  const f = new Date(a, m - 1, d + dias);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}

export type Novedad = "falta" | "malo" | "vencido" | "por vencer";

export interface EvaluacionElemento {
  diligenciado: boolean;
  novedades: Novedad[];
  conforme: boolean;
}

const fechaValida = (f: string) => /^\d{4}-\d{2}-\d{2}$/.test(f);

export function evaluarElemento(r: RegistroElemento | undefined, i: number, fechaInspeccion: string): EvaluacionElemento {
  const el = ELEMENTOS_BOTIQUIN[i];
  const cantidad = r ? parseFloat(r.cantidad.replace(",", ".")) : NaN;
  const diligenciado = !!r && !isNaN(cantidad) && (cantidad === 0 || !!r.estado);
  const novedades: Novedad[] = [];
  if (r && !isNaN(cantidad) && cantidad < el.minimo) novedades.push("falta");
  if (r?.estado === "Malo") novedades.push("malo");
  if (r && fechaValida(r.vence) && fechaValida(fechaInspeccion)) {
    if (r.vence < fechaInspeccion) novedades.push("vencido");
    else if (r.vence <= sumarDias(fechaInspeccion, DIAS_AVISO_VENCIMIENTO)) novedades.push("por vencer");
  }
  // «Por vencer» es un aviso: el elemento sigue siendo conforme.
  return { diligenciado, novedades, conforme: diligenciado && !novedades.some((n) => n !== "por vencer") };
}

export interface ResultadoBotiquin {
  elementos: EvaluacionElemento[];
  sinDiligenciar: number;
  conformes: number;
  faltantes: number;
  malos: number;
  vencidos: number;
  porVencer: number;
  cumplimiento: number | null;
  /** Texto con las novedades, para el hallazgo del informe. */
  hallazgo: string;
}

const fechaCorta = (iso: string) => iso.split("-").reverse().join("/");

export function evaluarBotiquin(b: Botiquin, fechaInspeccion: string): ResultadoBotiquin {
  const elementos = ELEMENTOS_BOTIQUIN.map((_, i) => evaluarElemento(b.elementos[i], i, fechaInspeccion));
  const con = (n: Novedad) => ELEMENTOS_BOTIQUIN.map((el, i) => ({ el, r: b.elementos[i], ev: elementos[i] })).filter((x) => x.ev.novedades.includes(n));
  const falta = con("falta"), malo = con("malo"), vencido = con("vencido"), porVencer = con("por vencer");
  const diligenciados = elementos.filter((e) => e.diligenciado).length;
  const conformes = elementos.filter((e) => e.conforme).length;
  const partes = [
    falta.length && `Elementos faltantes o por debajo de la cantidad mínima: ${falta.map((x) => `${x.el.contenido} (${x.r!.cantidad.trim() || "0"} de ${x.el.minima})`).join("; ")}.`,
    malo.length && `Elementos en mal estado: ${malo.map((x) => x.el.contenido).join("; ")}.`,
    vencido.length && `Elementos vencidos: ${vencido.map((x) => `${x.el.contenido} (${fechaCorta(x.r!.vence)})`).join("; ")}.`,
    porVencer.length && `Próximos a vencer: ${porVencer.map((x) => `${x.el.contenido} (${fechaCorta(x.r!.vence)})`).join("; ")}.`,
  ].filter(Boolean) as string[];
  return {
    elementos,
    sinDiligenciar: elementos.length - diligenciados,
    conformes,
    faltantes: falta.length,
    malos: malo.length,
    vencidos: vencido.length,
    porVencer: porVencer.length,
    cumplimiento: diligenciados ? conformes / diligenciados : null,
    hallazgo: partes.join(" "),
  };
}

export interface ResultadoBotiquines {
  botiquines: ResultadoBotiquin[];
  sinDiligenciar: number;
  cumplimiento: number | null;
  /** Botiquines con faltantes, elementos en mal estado o vencidos. */
  conHallazgo: Botiquin[];
  resumen: string;
}

export function calcularBotiquines(ins: InspeccionBotiquines): ResultadoBotiquines {
  const rs = ins.botiquines.map((b) => evaluarBotiquin(b, ins.encabezado.fecha));
  const conformes = rs.reduce((s, r) => s + r.conformes, 0);
  const diligenciados = rs.reduce((s, r) => s + r.elementos.length - r.sinDiligenciar, 0);
  const conHallazgo = ins.botiquines.filter((_, i) => rs[i].faltantes + rs[i].malos + rs[i].vencidos > 0);
  const n = ins.botiquines.length;
  const resumen = conHallazgo.length
    ? `Con hallazgos – ${conHallazgo.length} de ${n} ${n === 1 ? "botiquín" : "botiquines"} con novedades`
    : `Sin hallazgos – ${n} ${n === 1 ? "botiquín completo" : "botiquines completos"}`;
  return {
    botiquines: rs,
    sinDiligenciar: rs.reduce((s, r) => s + r.sinDiligenciar, 0),
    cumplimiento: diligenciados ? conformes / diligenciados : null,
    conHallazgo,
    resumen,
  };
}
