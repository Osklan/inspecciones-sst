// Generado desde SST-FO-070 V04 (Control operacional de contratistas, OINAC).
// No editar a mano: regenerar desde el Excel si el formato cambia.
import type { BloqueVerificacion } from "../domain/tipos";

export const SST_FO_070_VERSION = "V04";

export const SST_FO_070: BloqueVerificacion[] = [
  {
    "numero": 1,
    "titulo": "CONDICIONES GENERALES DEL FRENTE DE TRABAJO",
    "items": [
      {
        "codigo": "GEN-01",
        "criterio": "Área de trabajo delimitada con barrera física o cinta y conos, sin espacios abiertos al tránsito de terceros.",
        "criticidad": "Mayor",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "GEN-02",
        "criterio": "Orden y aseo: materiales apilados de forma estable (máx. 1,5 m de altura o según fabricante), sin puntillas, retales ni escombro en zonas de paso.",
        "criticidad": "Menor",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "GEN-03",
        "criterio": "Vías peatonales y vehiculares despejadas y separadas; rutas de evacuación sin obstrucción.",
        "criticidad": "Mayor",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "GEN-04",
        "criterio": "Iluminación suficiente para la tarea; en turno nocturno, torres o reflectores instalados y funcionando.",
        "criticidad": "Mayor",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "GEN-05",
        "criterio": "Control de acceso al frente: solo personal autorizado e identificado (carné del proyecto).",
        "criticidad": "Mayor",
        "evidencia": "Carné / listado de personal"
      },
      {
        "codigo": "GEN-06",
        "criterio": "Sustancias químicas rotuladas (SGA), con FDS disponible en sitio y almacenadas con contención secundaria.",
        "criticidad": "Mayor",
        "evidencia": "FDS / rotulado"
      },
      {
        "codigo": "GEN-07",
        "criterio": "Kit antiderrames disponible en el frente; residuos segregados en recipientes rotulados por tipo.",
        "criticidad": "Menor",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "GEN-08",
        "criterio": "Punto de hidratación y zona de sombra para pausas (control de estrés térmico).",
        "criticidad": "Mayor",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "GEN-09",
        "criterio": "Unidades sanitarias disponibles y en condiciones higiénicas para el número de trabajadores.",
        "criticidad": "Menor",
        "evidencia": "Inspección visual"
      }
    ],
    "prefijo": "GEN",
    "siempre": true
  },
  {
    "numero": 2,
    "titulo": "VERIFICACIÓN DE TRABAJADORES",
    "items": [
      {
        "codigo": "TRB-01",
        "criterio": "Validación QR en GREMA: trabajador habilitado (afiliación ARL y aportes PILA del mes vigentes).",
        "criticidad": "Crítico",
        "evidencia": "QR GREMA / planilla PILA"
      },
      {
        "codigo": "TRB-02",
        "criterio": "Inducción SST del proyecto y del aeropuerto realizada y registrada.",
        "criticidad": "Mayor",
        "evidencia": "Registro de inducción"
      },
      {
        "codigo": "TRB-03",
        "criterio": "Certificado de competencia vigente para la tarea crítica que ejecuta (alturas, espacios confinados, izaje, eléctrico, operación de equipos).",
        "criticidad": "Crítico",
        "evidencia": "Certificados / GREMA"
      },
      {
        "codigo": "TRB-04",
        "criterio": "Concepto médico ocupacional con aptitud para la tarea crítica (alturas, espacios confinados).",
        "criticidad": "Crítico",
        "evidencia": "Certificado de aptitud"
      },
      {
        "codigo": "TRB-05",
        "criterio": "EPP completo según la matriz de EPP del cargo, en buen estado y bien usado (casco con barbuquejo, gafas, botas, guantes, chaleco).",
        "criticidad": "Mayor",
        "evidencia": "Inspección visual / matriz EPP"
      },
      {
        "codigo": "TRB-06",
        "criterio": "Registro de entrega de EPP firmado y vigente.",
        "criticidad": "Menor",
        "evidencia": "Formato de entrega de EPP"
      },
      {
        "codigo": "TRB-07",
        "criterio": "Charla preoperacional del día realizada con firma de asistencia.",
        "criticidad": "Mayor",
        "evidencia": "Registro de charla"
      }
    ],
    "prefijo": "TRB",
    "siempre": true
  },
  {
    "numero": 3,
    "titulo": "OPERACIÓN EN LADO AIRE / ÁREA AEROPORTUARIA (si aplica)",
    "items": [
      {
        "codigo": "LAD-01",
        "criterio": "Permiso de acceso a área restringida vigente; personal con carné aeroportuario o escolta asignada.",
        "criticidad": "Crítico",
        "evidencia": "Carné / permiso de acceso"
      },
      {
        "codigo": "LAD-02",
        "criterio": "Coordinación con Operaciones Aeroportuarias registrada; radio en la frecuencia asignada y comunicación efectiva.",
        "criticidad": "Crítico",
        "evidencia": "Registro de coordinación / prueba de radio"
      },
      {
        "codigo": "LAD-03",
        "criterio": "Control de FOD: inventario de herramientas, recipientes con tapa, barrido del área al cierre.",
        "criticidad": "Crítico",
        "evidencia": "Inventario / inspección visual"
      },
      {
        "codigo": "LAD-04",
        "criterio": "Materiales livianos asegurados contra viento y chorro de motores (jet blast); nada suelto en el área.",
        "criticidad": "Mayor",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "LAD-05",
        "criterio": "Equipos y vehículos dentro del área autorizada, con baliza ámbar encendida y sin superar la altura máxima autorizada.",
        "criticidad": "Crítico",
        "evidencia": "Inspección visual / autorización"
      },
      {
        "codigo": "LAD-06",
        "criterio": "Conductores con permiso de conducción en plataforma vigente.",
        "criticidad": "Crítico",
        "evidencia": "Permiso de conducción"
      }
    ],
    "prefijo": "LAD",
    "siempre": false
  },
  {
    "numero": 4,
    "titulo": "TRABAJO EN ALTURAS – DOCUMENTACIÓN EN CAMPO (Res. 4272/2021)",
    "items": [
      {
        "codigo": "ALD-01",
        "criterio": "Permiso de trabajo en alturas diligenciado completo y firmado por emisor, coordinador y ejecutores, vigente para el día.",
        "criticidad": "Crítico",
        "evidencia": "Permiso de trabajo"
      },
      {
        "codigo": "ALD-02",
        "criterio": "ATS específico de la actividad, socializado y firmado por todo el personal.",
        "criticidad": "Mayor",
        "evidencia": "ATS"
      },
      {
        "codigo": "ALD-03",
        "criterio": "Certificado de trabajo en alturas vigente (nivel avanzado o reentrenamiento anual) de cada ejecutor.",
        "criticidad": "Crítico",
        "evidencia": "Certificados / GREMA"
      },
      {
        "codigo": "ALD-04",
        "criterio": "Coordinador de trabajo en alturas certificado presente en el frente durante toda la tarea.",
        "criticidad": "Crítico",
        "evidencia": "Certificado / verificación en sitio"
      },
      {
        "codigo": "ALD-05",
        "criterio": "Plan de rescate específico del frente, con equipo de rescate disponible y rescatista identificado.",
        "criticidad": "Crítico",
        "evidencia": "Plan de rescate / equipo"
      },
      {
        "codigo": "ALD-06",
        "criterio": "Hoja de vida e inspección preoperacional de los SPCC (arnés, eslingas, absorbedor, conectores) diligenciadas y registradas en GREMA.",
        "criticidad": "Mayor",
        "evidencia": "Preoperacional / GREMA"
      },
      {
        "codigo": "ALD-07",
        "criterio": "Registro de condiciones de salud previo a la actividad (pregunta de salud del día) firmado.",
        "criticidad": "Mayor",
        "evidencia": "Formato de condiciones de salud"
      }
    ],
    "prefijo": "ALD",
    "siempre": false
  },
  {
    "numero": 5,
    "titulo": "TRABAJO EN ALTURAS – CONDICIONES OPERATIVAS",
    "items": [
      {
        "codigo": "ALO-01",
        "criterio": "Área bajo el trabajo delimitada y señalizada (zona de caída de objetos).",
        "criticidad": "Mayor",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "ALO-02",
        "criterio": "Puntos de anclaje certificados o aprobados por persona calificada, con resistencia mínima de 5.000 lb (22,2 kN) por persona conectada.",
        "criticidad": "Crítico",
        "evidencia": "Certificado de anclaje"
      },
      {
        "codigo": "ALO-03",
        "criterio": "Línea de vida horizontal diseñada y aprobada por persona calificada, instalada según diseño (tensión, número de usuarios).",
        "criticidad": "Crítico",
        "evidencia": "Memoria de diseño / certificado"
      },
      {
        "codigo": "ALO-04",
        "criterio": "Trabajadores conectados al 100 % durante el desplazamiento y la tarea (doble eslinga o sistema retráctil).",
        "criticidad": "Crítico",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "ALO-05",
        "criterio": "Arnés de cuerpo entero bien ajustado; eslinga con absorbedor solo donde la distancia de caída libre lo permite.",
        "criticidad": "Crítico",
        "evidencia": "Inspección visual / cálculo de caída"
      },
      {
        "codigo": "ALO-06",
        "criterio": "Bordes y aberturas con baranda (pasamanos a 1,0 m, travesaño intermedio y rodapié) o tapa resistente señalizada.",
        "criticidad": "Crítico",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "ALO-07",
        "criterio": "Herramientas y materiales en altura asegurados contra caída (bolsos, cordones, mallas).",
        "criticidad": "Mayor",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "ALO-08",
        "criterio": "Condiciones climáticas aptas: sin lluvia, tormenta eléctrica ni viento fuerte.",
        "criticidad": "Crítico",
        "evidencia": "Verificación en sitio"
      }
    ],
    "prefijo": "ALO",
    "siempre": false
  },
  {
    "numero": 6,
    "titulo": "SISTEMAS DE ACCESO PARA TRABAJO EN ALTURAS",
    "items": [
      {
        "codigo": "ACC-01",
        "criterio": "Escaleras con inspección anual vigente e inspección preoperacional registrada en el check list de escaleras.",
        "criticidad": "Mayor",
        "evidencia": "Check list de escaleras"
      },
      {
        "codigo": "ACC-02",
        "criterio": "Escalera de extensión con relación 4:1, sobresale 1 m sobre el punto de apoyo y está amarrada o sostenida.",
        "criticidad": "Crítico",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "ACC-03",
        "criterio": "Andamio certificado, armado por persona competente, con tarjeta de estado (verde = apto) visible.",
        "criticidad": "Crítico",
        "evidencia": "Certificado / tarjeta de andamio"
      },
      {
        "codigo": "ACC-04",
        "criterio": "Andamio con base nivelada sobre placas, ruedas bloqueadas, plataforma completa, barandas y rodapié; arriostrado según altura.",
        "criticidad": "Crítico",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "ACC-05",
        "criterio": "Plataforma elevadora (manlift / tijera) con inspección vigente, preoperacional diaria y operador certificado.",
        "criticidad": "Crítico",
        "evidencia": "Certificado / preoperacional"
      },
      {
        "codigo": "ACC-06",
        "criterio": "En plataforma de brazo articulado: trabajador conectado al punto de anclaje de la canasta.",
        "criticidad": "Crítico",
        "evidencia": "Inspección visual"
      }
    ],
    "prefijo": "ACC",
    "siempre": false
  },
  {
    "numero": 7,
    "titulo": "TRABAJO ELÉCTRICO (RETIE)",
    "items": [
      {
        "codigo": "ELE-01",
        "criterio": "Permiso de trabajo eléctrico firmado, ATS específico y preoperacionales de equipos de medición disponibles.",
        "criticidad": "Crítico",
        "evidencia": "Permiso / ATS"
      },
      {
        "codigo": "ELE-02",
        "criterio": "Personal calificado: técnico o ingeniero con matrícula profesional vigente (CONTE / COPNIA) para la labor.",
        "criticidad": "Crítico",
        "evidencia": "Matrícula profesional"
      },
      {
        "codigo": "ELE-03",
        "criterio": "Cinco reglas de oro aplicadas: corte efectivo, bloqueo y etiquetado (LOTO), verificación de ausencia de tensión, puesta a tierra y en cortocircuito, señalización.",
        "criticidad": "Crítico",
        "evidencia": "Verificación en sitio / tarjetas LOTO"
      },
      {
        "codigo": "ELE-04",
        "criterio": "Detector de tensión verificado antes y después de usarlo en una fuente conocida.",
        "criticidad": "Crítico",
        "evidencia": "Verificación en sitio"
      },
      {
        "codigo": "ELE-05",
        "criterio": "Guantes dieléctricos de clase acorde a la tensión, con prueba dieléctrica vigente (máx. 6 meses) y prueba de inflado antes del uso.",
        "criticidad": "Crítico",
        "evidencia": "Certificado de ensayo"
      },
      {
        "codigo": "ELE-06",
        "criterio": "Ropa y careta contra arco con ATPV mayor o igual a la energía incidente del equipo (cal/cm²); herramientas aisladas 1000 V.",
        "criticidad": "Crítico",
        "evidencia": "Estudio de arco / etiqueta / EPP"
      },
      {
        "codigo": "ELE-07",
        "criterio": "Límites de aproximación respetados y área energizada identificada y delimitada.",
        "criticidad": "Crítico",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "ELE-08",
        "criterio": "Tableros provisionales de obra con protección diferencial (30 mA), puesta a tierra, tapas y rotulado.",
        "criticidad": "Crítico",
        "evidencia": "Prueba de diferencial / inspección"
      },
      {
        "codigo": "ELE-09",
        "criterio": "Extensiones y cables sin empalmes ni daños en el aislamiento, con clavijas industriales; no expuestos a agua ni a tránsito.",
        "criticidad": "Mayor",
        "evidencia": "Inspección visual"
      }
    ],
    "prefijo": "ELE",
    "siempre": false
  },
  {
    "numero": 8,
    "titulo": "TRABAJOS EN CALIENTE / SOLDADURA",
    "items": [
      {
        "codigo": "CAL-01",
        "criterio": "Permiso de trabajo en caliente firmado y vigente para el día.",
        "criticidad": "Crítico",
        "evidencia": "Permiso de trabajo"
      },
      {
        "codigo": "CAL-02",
        "criterio": "Radio de 11 m libre de materiales combustibles o con estos protegidos con mantas ignífugas.",
        "criticidad": "Crítico",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "CAL-03",
        "criterio": "Extintor (ABC o el adecuado a la clase de fuego) con carga vigente, a la mano en el punto de trabajo.",
        "criticidad": "Crítico",
        "evidencia": "Etiqueta de recarga"
      },
      {
        "codigo": "CAL-04",
        "criterio": "Vigía de fuego designado durante la tarea y mínimo 30 min después de terminarla.",
        "criticidad": "Crítico",
        "evidencia": "Permiso / verificación en sitio"
      },
      {
        "codigo": "CAL-05",
        "criterio": "Cilindros en posición vertical, asegurados con cadena y con capuchón cuando no están en uso; oxígeno separado de combustibles (6 m o barrera).",
        "criticidad": "Crítico",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "CAL-06",
        "criterio": "Reguladores con manómetros funcionales y válvulas antirretroceso (arrestallamas) en regulador y soplete.",
        "criticidad": "Crítico",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "CAL-07",
        "criterio": "Mangueras y conexiones sin fugas (prueba con agua jabonosa), sin empates con alambre.",
        "criticidad": "Mayor",
        "evidencia": "Prueba en sitio"
      },
      {
        "codigo": "CAL-08",
        "criterio": "Pantallas o biombos que protegen a terceros de la radiación y las chispas.",
        "criticidad": "Mayor",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "CAL-09",
        "criterio": "EPP de soldador: careta con filtro de sombra adecuada al proceso, guantes y peto de carnaza, ropa de algodón o ignífuga, protección respiratoria si hay humos.",
        "criticidad": "Mayor",
        "evidencia": "Inspección visual"
      }
    ],
    "prefijo": "CAL",
    "siempre": false
  },
  {
    "numero": 9,
    "titulo": "IZAJE DE CARGAS",
    "items": [
      {
        "codigo": "IZA-01",
        "criterio": "Plan de izaje firmado para izajes críticos (carga > 75 % de la tabla de carga, dos equipos, sobre personas o instalaciones energizadas).",
        "criticidad": "Crítico",
        "evidencia": "Plan de izaje"
      },
      {
        "codigo": "IZA-02",
        "criterio": "Operador de grúa y aparejador/señalero con certificado de competencia vigente.",
        "criticidad": "Crítico",
        "evidencia": "Certificados"
      },
      {
        "codigo": "IZA-03",
        "criterio": "Grúa con certificado de inspección vigente (tercero acreditado) y preoperacional del día.",
        "criticidad": "Crítico",
        "evidencia": "Certificado / preoperacional"
      },
      {
        "codigo": "IZA-04",
        "criterio": "Peso de la carga conocido y dentro de la tabla de carga para el radio y la configuración usados.",
        "criticidad": "Crítico",
        "evidencia": "Tabla de carga / plan de izaje"
      },
      {
        "codigo": "IZA-05",
        "criterio": "Estabilizadores extendidos sobre placas de apoyo, en terreno firme y nivelado.",
        "criticidad": "Crítico",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "IZA-06",
        "criterio": "Eslingas, grilletes y ganchos con capacidad marcada legible, sin daños; ganchos con pestillo de seguridad.",
        "criticidad": "Crítico",
        "evidencia": "Inspección visual / certificados"
      },
      {
        "codigo": "IZA-07",
        "criterio": "Área de izaje acordonada; nadie bajo la carga suspendida ni en el radio de giro; uso de vientos o líneas guía.",
        "criticidad": "Crítico",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "IZA-08",
        "criterio": "Altura de la pluma dentro de lo autorizado por Aerocivil / Operaciones (superficies limitadoras de obstáculos), con balizamiento.",
        "criticidad": "Crítico",
        "evidencia": "Autorización / coordinación"
      },
      {
        "codigo": "IZA-09",
        "criterio": "Velocidad del viento dentro del límite del fabricante, distancia segura a líneas eléctricas (RETIE).",
        "criticidad": "Crítico",
        "evidencia": "Anemómetro / verificación en sitio"
      }
    ],
    "prefijo": "IZA",
    "siempre": false
  },
  {
    "numero": 10,
    "titulo": "EXCAVACIONES",
    "items": [
      {
        "codigo": "EXC-01",
        "criterio": "Permiso de excavación y verificación previa de redes subterráneas (planos, detector de redes).",
        "criticidad": "Crítico",
        "evidencia": "Permiso / planos de redes"
      },
      {
        "codigo": "EXC-02",
        "criterio": "Excavaciones de 1,5 m o más con talud, entibado o sistema de protección diseñado según el tipo de suelo.",
        "criticidad": "Crítico",
        "evidencia": "Diseño / inspección visual"
      },
      {
        "codigo": "EXC-03",
        "criterio": "Material de excavación y equipos a 0,60 m o más del borde.",
        "criticidad": "Crítico",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "EXC-04",
        "criterio": "Acceso con escalera o rampa a máximo 7,5 m de cada trabajador cuando la profundidad es de 1,2 m o más.",
        "criticidad": "Mayor",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "EXC-05",
        "criterio": "Borde con baranda o barrera perimetral y señalización; iluminación nocturna.",
        "criticidad": "Crítico",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "EXC-06",
        "criterio": "Excavación inspeccionada por persona competente al iniciar el turno y después de cada lluvia; sin agua acumulada.",
        "criticidad": "Mayor",
        "evidencia": "Registro de inspección"
      }
    ],
    "prefijo": "EXC",
    "siempre": false
  },
  {
    "numero": 11,
    "titulo": "ESPACIOS CONFINADOS (Res. 0491/2020) – si aplica",
    "items": [
      {
        "codigo": "ECF-01",
        "criterio": "Permiso de entrada firmado; supervisor de entrada y vigía certificados en sitio.",
        "criticidad": "Crítico",
        "evidencia": "Permiso / certificados"
      },
      {
        "codigo": "ECF-02",
        "criterio": "Medición atmosférica antes y durante la tarea con equipo calibrado: O₂ entre 19,5 % y 23,5 %, LEL < 10 %, CO y H₂S bajo los límites del procedimiento.",
        "criticidad": "Crítico",
        "evidencia": "Registro de medición / certificado de calibración"
      },
      {
        "codigo": "ECF-03",
        "criterio": "Ventilación forzada instalada cuando se requiere.",
        "criticidad": "Crítico",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "ECF-04",
        "criterio": "Equipo de rescate (trípode, malacate, arnés) instalado y plan de rescate disponible.",
        "criticidad": "Crítico",
        "evidencia": "Plan de rescate / equipo"
      },
      {
        "codigo": "ECF-05",
        "criterio": "Fuentes de energía del espacio aisladas y bloqueadas (LOTO).",
        "criticidad": "Crítico",
        "evidencia": "Tarjetas LOTO"
      }
    ],
    "prefijo": "ECF",
    "siempre": false
  },
  {
    "numero": 12,
    "titulo": "MAQUINARIA, EQUIPOS Y VEHÍCULOS",
    "items": [
      {
        "codigo": "MAQ-01",
        "criterio": "Operador con licencia de conducción y certificado de operación vigente para el equipo.",
        "criticidad": "Crítico",
        "evidencia": "Licencia / certificado"
      },
      {
        "codigo": "MAQ-02",
        "criterio": "Inspección preoperacional diaria diligenciada, sin hallazgos abiertos que impidan operar.",
        "criticidad": "Mayor",
        "evidencia": "Formato preoperacional"
      },
      {
        "codigo": "MAQ-03",
        "criterio": "Alarma de reversa y luz estroboscópica o baliza funcionando.",
        "criticidad": "Mayor",
        "evidencia": "Prueba en sitio"
      },
      {
        "codigo": "MAQ-04",
        "criterio": "Cinturón de seguridad en uso; cabina con protección antivuelco (ROPS) donde aplique.",
        "criticidad": "Crítico",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "MAQ-05",
        "criterio": "Extintor con carga vigente y kit antiderrames a bordo.",
        "criticidad": "Mayor",
        "evidencia": "Etiqueta de recarga"
      },
      {
        "codigo": "MAQ-06",
        "criterio": "Sin fugas de aceite, combustible ni hidráulico; bandeja de contención en abastecimiento.",
        "criticidad": "Mayor",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "MAQ-07",
        "criterio": "Señalero para maniobras de reversa y en áreas con peatones.",
        "criticidad": "Mayor",
        "evidencia": "Verificación en sitio"
      },
      {
        "codigo": "MAQ-08",
        "criterio": "SOAT y revisión técnico-mecánica vigentes (vehículos).",
        "criticidad": "Mayor",
        "evidencia": "Documentos del vehículo"
      }
    ],
    "prefijo": "MAQ",
    "siempre": false
  },
  {
    "numero": 13,
    "titulo": "EMERGENCIAS Y EVACUACIÓN",
    "items": [
      {
        "codigo": "EME-01",
        "criterio": "Rutas de evacuación del frente identificadas y conocidas por el personal (preguntar a 2 trabajadores).",
        "criticidad": "Mayor",
        "evidencia": "Entrevista / señalización"
      },
      {
        "codigo": "EME-02",
        "criterio": "Punto de encuentro señalizado, accesible y conocido por el personal.",
        "criticidad": "Mayor",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "EME-03",
        "criterio": "Botiquín completo y vigente, camilla con inmovilizadores y cinturones en cada frente.",
        "criticidad": "Mayor",
        "evidencia": "Lista de chequeo del botiquín"
      },
      {
        "codigo": "EME-04",
        "criterio": "Extintores con carga vigente, accesibles, sin obstrucción y señalizados.",
        "criticidad": "Mayor",
        "evidencia": "Etiqueta de recarga"
      },
      {
        "codigo": "EME-05",
        "criterio": "Brigadistas del contratista identificados en el frente, con capacitación vigente.",
        "criticidad": "Mayor",
        "evidencia": "Listado / certificados"
      },
      {
        "codigo": "EME-06",
        "criterio": "Para tareas críticas: rescatistas y equipo de rescate disponibles; números de emergencia publicados.",
        "criticidad": "Crítico",
        "evidencia": "Plan de rescate / cartelera"
      }
    ],
    "prefijo": "EME",
    "siempre": true
  },
  {
    "numero": 14,
    "titulo": "SEÑALIZACIÓN",
    "items": [
      {
        "codigo": "SEN-01",
        "criterio": "Señalización según los riesgos del frente (caída de objetos, caída a distinto nivel, maquinaria, cargas suspendidas, riesgo eléctrico).",
        "criticidad": "Mayor",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "SEN-02",
        "criterio": "Señalización de uso obligatorio de EPP en el ingreso al frente.",
        "criticidad": "Menor",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "SEN-03",
        "criterio": "Señalización de acceso restringido y personal no autorizado.",
        "criticidad": "Menor",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "SEN-04",
        "criterio": "Cerramiento de obra continuo que impide el ingreso de personas ajenas.",
        "criticidad": "Mayor",
        "evidencia": "Inspección visual"
      },
      {
        "codigo": "SEN-05",
        "criterio": "Señalización de prohibido fumar y de ubicación de botiquín y extintores.",
        "criticidad": "Menor",
        "evidencia": "Inspección visual"
      }
    ],
    "prefijo": "SEN",
    "siempre": true
  },
  {
    "numero": 15,
    "titulo": "COMPORTAMIENTO Y DISCIPLINA OPERATIVA",
    "items": [
      {
        "codigo": "COM-01",
        "criterio": "Personal cumple el procedimiento y las instrucciones del supervisor.",
        "criticidad": "Mayor",
        "evidencia": "Observación de la tarea"
      },
      {
        "codigo": "COM-02",
        "criterio": "No se usa el celular durante tareas críticas ni en desplazamientos en zonas de riesgo.",
        "criticidad": "Mayor",
        "evidencia": "Observación de la tarea"
      },
      {
        "codigo": "COM-03",
        "criterio": "Sin indicios de consumo de alcohol o sustancias psicoactivas.",
        "criticidad": "Crítico",
        "evidencia": "Observación / prueba si aplica"
      },
      {
        "codigo": "COM-04",
        "criterio": "Comunicación efectiva entre trabajadores, señalero y operador.",
        "criticidad": "Mayor",
        "evidencia": "Observación de la tarea"
      },
      {
        "codigo": "COM-05",
        "criterio": "Se ejerce el derecho a parar la tarea ante condiciones inseguras y se reportan actos y condiciones inseguras.",
        "criticidad": "Mayor",
        "evidencia": "Entrevista / reportes"
      }
    ],
    "prefijo": "COM",
    "siempre": true
  }
];
