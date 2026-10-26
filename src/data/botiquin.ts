// Dotación mínima del botiquín, del formato SST-FO-077 V01 «Inspección de botiquín».

export interface ElementoBotiquin {
  grupo: string;
  contenido: string;
  /** Cantidad mínima tal como está en el formato. */
  minima: string;
  /** Parte numérica de la cantidad mínima, para comparar con lo encontrado. */
  minimo: number;
}

export const SST_FO_077_VERSION = "SST-FO-077 V01";

const e = (grupo: string, contenido: string, minima: string): ElementoBotiquin => ({ grupo, contenido, minima, minimo: parseFloat(minima) });

const ANT = "Antisépticos", CUR = "Material de curación", INS = "Instrumental y otros elementos adicionales";

export const ELEMENTOS_BOTIQUIN: ElementoBotiquin[] = [
  e(ANT, "Alcohol antiséptico, frasco por 275 ml", "275 ml"),
  e(ANT, "Yodopovidona (jabón quirúrgico)", "1 und"),
  e(ANT, "Solución salina 250 cc o 500 cc", "2 und"),
  e(CUR, "Guantes de látex para examen", "100 und"),
  e(CUR, "Venda elástica 2 x 5 yardas", "1 und"),
  e(CUR, "Venda elástica 3 x 5 yardas", "1 und"),
  e(CUR, "Venda de algodón 3 x 5 yardas", "1 und"),
  e(CUR, "Venda de algodón 5 x 5 yardas", "1 und"),
  e(CUR, "Esparadrapo de tela, rollo de 4\"", "1 und"),
  e(CUR, "Gasas limpias, paquete", "1 und"),
  e(CUR, "Curitas", "50 und"),
  e(CUR, "Bajalenguas", "20 und"),
  e(INS, "Termómetro de mercurio o digital", "1 und"),
  e(INS, "Tapabocas", "10 und"),
  e(INS, "Jeringas 10 cc", "10 und"),
  e(INS, "Tijeras punta roma", "1 und"),
];
