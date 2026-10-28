// Categorías de equipos y EPP, tomadas de los informes de OINAC de septiembre de 2026
// (equipos de protección contra caídas; LOTO y equipos dieléctricos).

/** Cómo se presenta la categoría en el informe. */
export type FormatoTabla =
  | "inventario" // Titular · Elemento · Marca · Serial · Resultado
  | "kit" // matriz de componentes × trabajador (X = disponible)
  | "condicion" // N° · Equipo · Condición observada · Resultado
  | "certificado" // Asignado a · Equipo · Última prueba · Laboratorio · Código
  | "inspeccionAnual"; // Equipo · Última inspección anual · Condición · Resultado

/** Ítem de una ficha de inspección. `bueno` es la respuesta que indica buen estado: los ítems
 * redactados como defecto («Cintas deshilachadas») están bien cuando la respuesta es NO. */
export interface ItemFicha {
  texto: string;
  bueno: "SI" | "NO";
}

/** Elemento con ficha propia en el formato (arnés, eslinga, traje, capucha con visor). */
export interface TipoElemento {
  id: string;
  nombre: string;
  partes: { nombre: string; items: ItemFicha[] }[];
  /** El formato pide fechas de lavado (trajes de arco). */
  lavado?: boolean;
}

export interface CategoriaEquipo {
  id: string;
  nombre: string;
  formato: FormatoTabla;
  aspectos: string[];
  /** Componentes del kit (solo formato «kit»). */
  componentes?: string[];
  /** Meses de vigencia de la prueba o inspección anual; pasado ese plazo se alerta. */
  vigenciaMeses?: number;
  /** Código del formato de la ficha por equipo, p. ej. «SST-FO-085 V02». */
  formatoFicha?: string;
  /** Elementos con ficha propia; si están, la lista de verificación de cada equipo sale de su ficha. */
  tiposElemento?: TipoElemento[];
}

const ASPECTOS_GENERALES = [
  "Estado físico general, limpieza y condiciones de conservación.",
  "Presencia de grietas, fisuras, fracturas, desgaste o deformaciones.",
  "Integridad de componentes, accesorios y sistemas de ajuste y cierre.",
  "Legibilidad de etiquetas, especificaciones técnicas y fecha de inspección anual.",
  "Condiciones de almacenamiento y cumplimiento de condiciones mínimas de seguridad para su uso.",
];

const defecto = (...t: string[]): ItemFicha[] => t.map((texto) => ({ texto, bueno: "NO" }));
const requisito = (...t: string[]): ItemFicha[] => t.map((texto) => ({ texto, bueno: "SI" }));

const CINTAS = defecto(
  "Agujeros o perforaciones",
  "Cintas deshilachadas",
  "Hay torsión (fibras duras o deformadas).",
  "Contaminación excesiva por suciedad.",
);
const CINTAS_FIN = defecto(
  "Salpicadura de pintura o sustancias química y rigidez en cinta.",
  "Degradación por U.V. (pérdida de color y superficie quebradiza).",
  "Talladuras o cortes de la reata.",
);
const REATA = [...CINTAS.slice(0, 2), ...defecto("Desgastadas"), ...CINTAS.slice(2), ...CINTAS_FIN];
const METALICAS = (nombre: string): TipoElemento["partes"][number] => ({
  nombre,
  items: [
    ...defecto("Desgaste en los extremos"),
    ...requisito("Los ganchos de conexión son 100 % recubiertos dieléctricos"),
    ...defecto("Deformación", "Fisuras, golpes, hundimientos.", "Bordes filosos o arrugados."),
  ],
});

/** Formato SST-FO-085 V02 «Inspección de equipos de protección contra caídas». */
const FICHAS_CAIDAS: TipoElemento[] = [
  {
    id: "arnes",
    nombre: "Arnés",
    partes: [
      { nombre: "Cintas y/o correas", items: [...CINTAS, ...defecto("Quemadura por soldadura"), ...CINTAS_FIN] },
      { nombre: "Costuras", items: defecto("Abiertas", "Hebras sueltas", "Reventadas") },
      {
        nombre: "Partes metálicas (hebillas, herrajes y argollas en «D»)",
        items: [
          ...defecto("Desgaste en los extremos", "Deformación"),
          ...requisito("Los ganchos de conexión son 100 % recubiertos dieléctricos"),
          ...defecto("Fisuras, golpes, hundimientos.", "Bordes filosos o arrugados."),
        ],
      },
    ],
  },
  {
    id: "eslinga",
    nombre: "Eslinga",
    partes: [
      {
        nombre: "Absorbedor",
        items: defecto(
          "Agujeros o rasgaduras",
          "Costuras sueltas o reventadas",
          "Deterioro o hebras rotas",
          "Contaminación excesiva por suciedad.",
          "Quemadura por soldadura",
          "Salpicadura de pintura y rigidez en cinta.",
          "Absorbedor abierto, desgarrado o impactado",
        ),
      },
      { nombre: "Reata, cuerda", items: REATA },
      METALICAS("Partes metálicas (hebillas, herrajes y mosquetones)"),
    ],
  },
  {
    id: "eslinga-posicionamiento",
    nombre: "Eslinga de posicionamiento",
    partes: [{ nombre: "Reata, cuerda", items: REATA }, METALICAS("Partes metálicas (hebillas, herrajes y mosquetones)")],
  },
];

const TEJIDO = "Integridad del tejido: sin desgaste, roturas, deshilachados, quemaduras previas o zonas delgadas.";
const MANCHAS = "Contaminación: sin manchas de aceite, grasa, pintura o materiales inflamables.";
const VELCROS = "Velcros: buen estado y cierre hermético.";
const COSTURAS = "Costuras: sin hilos rotos o costuras deshechas.";
const ETIQUETA = "Etiquetado: etiqueta legible con Arc Rating visible.";

/** Formato SST-FO-087 V01 «Inspección de traje de protección contra arco eléctrico». */
const FICHA_TRAJE: TipoElemento = {
  id: "traje",
  nombre: "Traje",
  lavado: true,
  partes: [
    { nombre: "Overol", items: requisito(TEJIDO, MANCHAS, VELCROS, COSTURAS, "Estado general del overol: limpio y seco.", "Capucha: ajuste adecuado y sin daños.", ETIQUETA) },
    { nombre: "Chaqueta", items: requisito(TEJIDO, MANCHAS, VELCROS, COSTURAS, "Estado general de la chaqueta: limpio y seco.", ETIQUETA) },
  ],
};
const FICHA_CAPUCHA: TipoElemento = {
  id: "capucha-visor",
  nombre: "Capucha con visor",
  lavado: true,
  partes: [
    {
      nombre: "Casco",
      items: requisito(
        "Integridad de la carcasa: sin grietas, deformaciones o impactos visibles",
        "Suspensión interna: en buen estado, sin roturas ni desgaste",
        "Sistema de ajuste: funcional y firme",
        "Fecha de fabricación / vencimiento: dentro de la vida útil",
        "Certificación visible (ANSI / IEC): etiqueta legible (Clase E)",
      ),
    },
    {
      nombre: "Capucha y visor",
      items: requisito(
        "Integridad de la careta: sin grietas, deformaciones o impactos visibles",
        "Pantalla facial: sin rayaduras profundas, grietas o suciedad",
        VELCROS,
        "Capucha: ajuste adecuado y sin daños.",
        ETIQUETA,
        "Estado general del traje: limpio y seco.",
        "Fecha de fabricación / vencimiento: dentro de la vida útil.",
        "Certificación visible (ANSI / IEC): etiqueta legible.",
      ),
    },
  ],
};

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
    vigenciaMeses: 12,
    formatoFicha: "SST-FO-085 V02",
    tiposElemento: FICHAS_CAIDAS,
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
  { id: "traje-arco", nombre: "Trajes de protección para arco eléctrico", formato: "condicion", aspectos: ASPECTOS_GENERALES, formatoFicha: "SST-FO-087 V01", tiposElemento: [FICHA_TRAJE] },
  { id: "careta-arco", nombre: "Caretas anti arco eléctrico", formato: "condicion", aspectos: ASPECTOS_GENERALES, formatoFicha: "SST-FO-087 V01", tiposElemento: [FICHA_CAPUCHA] },
  { id: "guantes-dielectricos", nombre: "Guantes dieléctricos", formato: "certificado", aspectos: ASPECTOS_GENERALES, vigenciaMeses: 6 },
  { id: "pertigas-alfombras", nombre: "Pértigas y alfombra dieléctrica", formato: "inspeccionAnual", aspectos: ASPECTOS_GENERALES, vigenciaMeses: 12 },
];
