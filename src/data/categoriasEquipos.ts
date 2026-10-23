// Categorías de equipos y EPP, tomadas de los informes de OINAC de septiembre de 2026
// (equipos de protección contra caídas; LOTO y equipos dieléctricos).

/** Cómo se presenta la categoría en el informe. */
export type FormatoTabla =
  | "inventario" // Titular · Elemento · Marca · Serial · Resultado
  | "kit" // matriz de componentes × trabajador (X = disponible)
  | "condicion" // N° · Equipo · Condición observada · Resultado
  | "certificado" // Asignado a · Equipo · Última prueba · Laboratorio · Código
  | "inspeccionAnual"; // Equipo · Última inspección anual · Condición · Resultado

export interface CategoriaEquipo {
  id: string;
  nombre: string;
  formato: FormatoTabla;
  aspectos: string[];
  /** Componentes del kit (solo formato «kit»). */
  componentes?: string[];
}

const ASPECTOS_GENERALES = [
  "Estado físico general, limpieza y condiciones de conservación.",
  "Presencia de grietas, fisuras, fracturas, desgaste o deformaciones.",
  "Integridad de componentes, accesorios y sistemas de ajuste y cierre.",
  "Legibilidad de etiquetas, especificaciones técnicas y fecha de inspección anual.",
  "Condiciones de almacenamiento y cumplimiento de condiciones mínimas de seguridad para su uso.",
];

export const CATEGORIAS_EQUIPOS: CategoriaEquipo[] = [
  {
    id: "contra-caidas",
    nombre: "Equipos de protección contra caídas",
    formato: "inventario",
    aspectos: [
      "Estado general del equipo.",
      "Integridad de las cintas y reatas.",
      "Ausencia de cortes, perforaciones, quemaduras, abrasión o contaminación.",
      "Estado de las costuras.",
      "Funcionamiento de hebillas y elementos metálicos.",
      "Estado de ganchos, conectores y absorbedores de energía.",
      "Legibilidad de etiquetas de identificación.",
      "Estado de argollas y puntos de conexión.",
      "Evidencia de deformaciones o impactos.",
      "Limpieza y almacenamiento del equipo.",
    ],
  },
  {
    id: "loto",
    nombre: "Kits de bloqueo y etiquetado (LOTO)",
    formato: "kit",
    aspectos: [...ASPECTOS_GENERALES, "Funcionamiento de los mecanismos de bloqueo.", "Disponibilidad de los elementos asignados a cada trabajador e identificación de faltantes."],
    componentes: [
      "Bloqueo de breaker eléctrico 13 mm",
      "Bloqueo de breaker eléctrico 11 mm",
      "Bloqueo de breaker multipolar",
      "Bloqueo de disyuntor PSL-CBL",
      "Mini aldaba dieléctrica",
      "Bloqueador de totalizador monofásico",
      "Bloqueador de totalizador de mayor amperaje",
      "Bloqueador de breaker pequeño",
      "Cerrojo de bloqueo múltiple",
      "Candado de bloqueo dieléctrico",
    ],
  },
  { id: "traje-arco", nombre: "Trajes de protección para arco eléctrico", formato: "condicion", aspectos: ASPECTOS_GENERALES },
  { id: "careta-arco", nombre: "Caretas anti arco eléctrico", formato: "condicion", aspectos: ASPECTOS_GENERALES },
  { id: "guantes-dielectricos", nombre: "Guantes dieléctricos", formato: "certificado", aspectos: ASPECTOS_GENERALES },
  { id: "pertigas-alfombras", nombre: "Pértigas y alfombra dieléctrica", formato: "inspeccionAnual", aspectos: ASPECTOS_GENERALES },
];
