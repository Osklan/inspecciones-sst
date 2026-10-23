// Listas de verificación de condiciones locativas.
// «Baños» sale de la metodología del informe de baños de contratistas CCNC (19/10/2026).
// Las demás áreas son un borrador para validar con SST OINAC.

export interface ListaLocativa {
  id: string;
  nombre: string;
  validada: boolean;
  aspectos: string[];
  normas: { aspecto: string; requisito: string; fuente: string }[];
}

export const LISTAS_LOCATIVAS: ListaLocativa[] = [
  {
    id: "banos",
    nombre: "Baños",
    validada: true,
    aspectos: [
      "Limpieza e higiene de la cabina, el sanitario y el lavamanos.",
      "Ausencia de malos olores.",
      "Dotación de papel higiénico, jabón para el lavado de manos y toallas para el secado de manos.",
      "Caneca o papelera con bolsa.",
      "Señalización del baño por sexo (hombres / mujeres).",
      "Ubicación, estabilidad y condiciones del acceso al baño.",
      "Disponibilidad de agua en los baños de edificación.",
    ],
    normas: [
      { aspecto: "Proporción", requisito: "Un inodoro, un lavamanos, un orinal y una ducha por cada quince (15) trabajadores, separados por sexo.", fuente: "Resolución 2400 de 1979, Art. 17" },
      { aspecto: "Dotación interna", requisito: "Servicios sanitarios dotados con papel higiénico, recipientes para basura, toallas de papel, jabón, desinfectantes y desodorantes.", fuente: "Resolución 2400 de 1979, Art. 17" },
      { aspecto: "Lavado de manos", requisito: "Lavamanos con agua limpia disponible para el personal del frente de obra.", fuente: "Resolución 2400 de 1979, Art. 17" },
      { aspecto: "Residuos", requisito: "Evacuación de los residuos mediante procedimientos adecuados, con tratamiento previo según las normas de higiene y saneamiento.", fuente: "Resolución 2400 de 1979, Art. 39" },
      { aspecto: "Gestión ambiental", requisito: "Recolección, transporte y disposición final de los residuos de los baños portátiles por un gestor que cuente con las autorizaciones ambientales vigentes, con soportes de disposición.", fuente: "Decreto 1076 de 2015" },
    ],
  },
  {
    id: "cocinas",
    nombre: "Cocinas y comedores",
    validada: false,
    aspectos: [
      "Limpieza de pisos, paredes, mesones y superficies en contacto con alimentos.",
      "Almacenamiento de alimentos protegido, rotulado y refrigerado cuando aplica.",
      "Lavamanos con jabón y toallas para el secado de manos.",
      "Canecas con tapa y bolsa; residuos separados.",
      "Iluminación y ventilación adecuadas.",
      "Instalaciones eléctricas y de gas en buen estado.",
      "Ausencia de plagas o evidencias de su presencia.",
    ],
    normas: [],
  },
  {
    id: "cuartos-tecnicos",
    nombre: "Cuartos técnicos",
    validada: false,
    aspectos: [
      "Acceso restringido y señalizado.",
      "Orden y aseo; sin almacenamiento de materiales ajenos al cuarto.",
      "Tableros con tapas, rotulados y sin cables expuestos.",
      "Iluminación y ventilación adecuadas.",
      "Extintor adecuado, con carga vigente y accesible.",
      "Pisos, paredes y techos sin humedad ni deterioro.",
    ],
    normas: [],
  },
  {
    id: "almacenamiento",
    nombre: "Almacenamiento",
    validada: false,
    aspectos: [
      "Materiales apilados de forma estable y a la altura permitida.",
      "Estanterías ancladas, en buen estado y sin sobrecarga.",
      "Sustancias químicas rotuladas (SGA), con FDS disponible y contención secundaria.",
      "Pasillos y salidas despejados.",
      "Extintor adecuado, con carga vigente y accesible.",
      "Iluminación y ventilación adecuadas.",
    ],
    normas: [],
  },
];
