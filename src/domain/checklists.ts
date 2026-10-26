// Listas de verificación diligenciadas, en PDF aparte del informe y con las mismas firmas.
import { SST_FO_070, SST_FO_070_VERSION } from "../data/sstFo070";
import { bloquesActivos, calcularResultado, generarPlanAccion, marcarNoAplica } from "./controlOperacional";
import type { CategoriaEquipo } from "../data/categoriasEquipos";
import { aspectosNoConformes, categoria, firmantesDe, nombreEquipo, siNo, tipoDe, venceEl, type Equipo, type InspeccionEquipos, type SeccionEquipos } from "./equipos";
import { firmasInforme as firmasEquipos } from "./informeEquipos";
import { firmasInforme as firmasLocativa } from "./informeLocativa";
import { cabecera, celdaRespuesta, CSS, esc, fecha, tablaFirmas } from "./informeComun";
import type { InspeccionFrente } from "./inspeccion";
import { calcularLocativa, firmasDePunto, grupoEn, listaDe, numeroEn, resultadoPunto, type InspeccionLocativa, type PuntoLocativo } from "./locativas";

const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)} %`);
const documento = (cuerpo: string) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
.chk td, .chk th { font-size: 9.5px; padding: 3px 4px; }
.grp td { background: #D9E2F3; font-weight: bold; }
</style></head><body>${cuerpo}</body></html>`;

/** Fila de datos de dos columnas de etiqueta y valor. */
const fila = (a: string, va: string, b: string, vb: string) =>
  `<tr><td class="lbl">${a}</td><td>${va}</td><td class="lbl">${b}</td><td>${vb}</td></tr>`;

export function checklistFrenteHtml(ins: InspeccionFrente): string {
  const e = ins.encabezado;
  const activos = bloquesActivos(SST_FO_070, ins.actividadesCriticas);
  const respuestas = marcarNoAplica(SST_FO_070, activos, ins.respuestas);
  const r = calcularResultado(SST_FO_070, respuestas);
  const plan = generarPlanAccion(SST_FO_070, respuestas, e.fecha);
  const nActivos = new Set(activos.map((b) => b.numero));
  const actividades = esc(e.actividadesTexto) || activos.filter((b) => !b.siempre).map((b) => esc(b.titulo)).join("; ") || "Ninguna";

  const bloques = SST_FO_070.map((b) => {
    const filas = b.items
      .map((it) => {
        const x = respuestas[it.codigo];
        const res = x?.resultado ?? "";
        return `<tr><td style="white-space:nowrap">${it.codigo}</td><td>${esc(it.criterio)}</td><td class="${it.criticidad === "Crítico" ? "crit" : ""}">${it.criticidad}</td><td class="c${res === "NC" ? " crit" : ""}">${res}</td><td>${esc(it.evidencia)}</td><td>${esc(x?.observacion ?? "")}</td></tr>`;
      })
      .join("");
    const nota = nActivos.has(b.numero) ? "" : " – no aplica en este frente";
    return `<tr class="grp"><td colspan="6">${b.numero}. ${esc(b.titulo)}${nota}</td></tr>${filas}`;
  }).join("");

  const filasBloque = r.bloques
    .map((b) => `<tr><td>${b.numero}. ${esc(b.titulo)}</td><td class="c">${b.c}</td><td class="c">${b.nc}</td><td class="c">${b.na}</td><td class="c">${b.cumplimiento === null ? "No evaluado" : pct(b.cumplimiento)}</td></tr>`)
    .join("");
  const t = r.total;

  const filasPlan = plan
    .map((p, i) => `<tr><td class="c">${i + 1}</td><td>${p.codigo}</td><td>${esc(p.bloque)}</td><td>${esc(p.item)}</td><td class="${p.criticidad === "Crítico" ? "crit" : ""}">${p.criticidad}</td><td>${esc(p.hallazgo)}</td><td>${fecha(p.fechaLimite)}</td><td>ABIERTO</td></tr>`)
    .join("");

  return documento(`${cabecera("CONTROL OPERACIONAL DE CONTRATISTAS", `SST-FO-070 ${SST_FO_070_VERSION}<br>Verificación técnica en campo con criterios de aceptación, criticidad y plan de acción`)}
<div class="bar">INFORMACIÓN GENERAL</div>
<table>
${fila("Proyecto / frente de trabajo", esc(e.proyecto), "Contratista", esc(e.contratista))}
${fila("Ubicación", esc(e.ubicacion), "N° de trabajadores", esc(e.trabajadores))}
${fila("Fecha de verificación", fecha(e.fecha), "Hora", esc(e.hora))}
${fila("Responsable SST contratista", esc(e.responsableContratista), "Verificado por (SST OINAC)", esc(e.verificadoPor))}
<tr><td class="lbl">Actividades críticas en ejecución</td><td colspan="3">${actividades}</td></tr>
</table>
<p><i>Resultado: C = cumple · NC = no cumple · NA = no aplica. Verifique la evidencia indicada antes de marcar C. Un NC en un ítem CRÍTICO detiene la tarea asociada hasta su corrección.</i></p>
<table class="chk"><tr><th>Código</th><th style="width:40%">Ítem / criterio técnico de verificación</th><th>Criticidad</th><th class="c">Resultado (C / NC / NA)</th><th>Evidencia a verificar</th><th>Observaciones / hallazgo</th></tr>${bloques}</table>
<div class="bar">RESULTADO DE LA VERIFICACIÓN</div>
<table class="chk"><tr><th>Bloque</th><th class="c">C</th><th class="c">NC</th><th class="c">NA</th><th class="c">% cumplimiento = C / (C + NC)</th></tr>${filasBloque}
<tr><td><b>TOTAL</b></td><td class="c"><b>${t.c}</b></td><td class="c"><b>${t.nc}</b></td><td class="c"><b>${t.na}</b></td><td class="c"><b>${t.cumplimiento === null ? "No evaluado" : pct(t.cumplimiento)}</b></td></tr></table>
<table>
${fila("Ítems sin diligenciar", String(r.sinDiligenciar), "NC críticas", String(r.ncPorCriticidad["Crítico"]))}
${fila("NC mayores", String(r.ncPorCriticidad.Mayor), "NC menores", String(r.ncPorCriticidad.Menor))}
${fila("% de cumplimiento total", pct(t.cumplimiento), "Calificación", r.calificacion ?? "No evaluado")}
<tr><td class="lbl">¿LA ACTIVIDAD PUEDE CONTINUAR?</td><td colspan="3" class="dec">${esc(r.decision)}</td></tr>
</table>
<div class="bar">ACCIONES TOMADAS EN SITIO</div>
<table><tr><td style="height:40px">${esc(ins.accionesEnSitio) || "Ninguna registrada."}</td></tr></table>
<div class="bar">FIRMAS</div>
${tablaFirmas([
  { firma: ins.firmas?.oinac, cargo: "Profesional SST OINAC", nombre: e.verificadoPor },
  { firma: ins.firmas?.contratista, cargo: "Profesional SST contratista", nombre: e.responsableContratista },
])}
${plan.length ? `<div style="page-break-before:always">${cabecera("PLAN DE ACCIÓN Y SEGUIMIENTO DE NO CONFORMIDADES", `SST-FO-070 ${SST_FO_070_VERSION}`)}</div>
<table>
${fila("Contratista", esc(e.contratista), "NC registradas", String(plan.length))}
${fila("Fecha de verificación", fecha(e.fecha), "Verificado por", esc(e.verificadoPor))}
</table>
<table class="chk"><tr><th class="c">N°</th><th>Código</th><th>Bloque</th><th style="width:28%">Ítem no conforme</th><th>Criticidad</th><th>Hallazgo (de la inspección)</th><th>Fecha límite</th><th>Estado</th></tr>${filasPlan}</table>` : ""}`);
}

/** Hoja por punto con el formato SST-FO-086 (inspección integral a concesiones). */
function hojasIntegrales(ins: InspeccionLocativa): string {
  const e = ins.encabezado;
  const l = listaDe(ins);
  const marca = (v: string | undefined, x: string) => `<td class="c${x === "NC" ? " crit" : ""}">${v === x ? "X" : ""}</td>`;
  const campo = (p: PuntoLocativo, id: string) => esc(p.campos?.[id] ?? "");
  return ins.puntos
    .map((p, i) => {
      const rp = resultadoPunto(p, l);
      const tipos = l.camposPunto?.find((c) => c.id === "tipo");
      const marcados = (p.campos?.tipo ?? "").split(",").map((x) => x.trim());
      const casillas = tipos?.opciones?.map((o) => `${marcados.includes(o) ? "☒" : "☐"} ${esc(o.toUpperCase())}`).join("&nbsp;&nbsp; ") ?? "";
      let tabla = "";
      const filas = l.aspectos
        .map((a, k) => {
          const g = grupoEn(l, k);
          const v = p.respuestas[k];
          const cab = g ? `${tabla ? "</table>" : ""}<p style="page-break-after:avoid"><b>${esc(g)}</b></p><table class="chk"><tr><th class="c" style="width:7%">Ítem</th><th style="width:48%">Descripción</th><th class="c">C</th><th class="c">NC</th><th class="c">NA</th><th>Observaciones</th></tr>` : "";
          tabla = "1";
          return `${cab}<tr><td class="c">${numeroEn(l, k)}</td><td>${esc(a)}</td>${marca(v, "C")}${marca(v, "NC")}${marca(v, "NA")}<td>${esc(p.observaciones?.[k] ?? "")}</td></tr>`;
        })
        .join("");
      const nc = l.aspectos.filter((_, k) => p.respuestas[k] === "NC");
      const hallazgo = p.hallazgo.trim() || (nc.length ? `No cumple: ${nc.join("; ")}.` : "Sin hallazgos.");
      const firmas = firmasDePunto(l, p).map((f) => ({ firma: f.id === "inspector" && !f.firma ? ins.firmas?.elaboro : f.firma, cargo: f.rol, nombre: f.id === "inspector" && !f.nombre ? e.elaboradoPor : f.nombre }));
      return `<div${i ? ' style="page-break-before:always"' : ""}>
${cabecera("FORMATO DE INSPECCIÓN INTEGRAL A CONCESIONES", esc(l.formato ?? ""))}
<div class="bar">1. INFORMACIÓN GENERAL</div>
<table>
<tr><td class="lbl">Concesión</td><td colspan="3">${esc(p.nombre || `Concesión ${i + 1}`)}</td></tr>
${fila("Fecha de inspección", fecha(e.fecha), "Hora inicio", campo(p, "hora"))}
<tr><td class="lbl">Tipo de inspección</td><td colspan="3">${casillas}</td></tr>
${fila("Representante Bombero", campo(p, "bombero"), "Representante SST", campo(p, "sst"))}
</table>
<div class="bar">2. CRITERIOS DE VERIFICACIÓN</div>
<p><i>Marque según corresponda: C = Cumple | NC = No cumple | NA = No aplica. Cumplimiento: ${pct(rp.cumplimiento)}.</i></p>
${filas}</table>
<div class="bar">4. HALLAZGOS Y ACCIONES</div>
<table>${fila("Hallazgo", esc(hallazgo), "Acción de mejora", esc(p.accion))}</table>
<div class="bar">5. FIRMAS</div>
${tablaFirmas(firmas)}
</div>`;
    })
    .join("");
}

export function checklistLocativaHtml(ins: InspeccionLocativa): string {
  const e = ins.encabezado;
  const l = listaDe(ins);
  if (l.firmasPunto) return documento(hojasIntegrales(ins));
  const r = calcularLocativa(ins);
  const marca = (v: string | undefined, x: string) => `<td class="c${x === "NC" ? " crit" : ""}">${v === x ? "X" : ""}</td>`;

  const puntos = ins.puntos
    .map((p, i) => {
      const rp = resultadoPunto(p, l);
      const filas = l.aspectos
        .map((a, k) => {
          const g = grupoEn(l, k);
          const v = p.respuestas[k];
          return `${g ? `<tr class="grp"><td colspan="5">${esc(g.toUpperCase())}</td></tr>` : ""}<tr><td>${esc(a)}</td>${marca(v, "C")}${marca(v, "NC")}${marca(v, "NA")}<td>${esc(p.observaciones?.[k] ?? "")}</td></tr>`;
        })
        .join("");
      const resultado = rp.nc ? p.hallazgo.trim() || "Con aspectos que no cumplen." : "Cumple con todos los aspectos evaluados.";
      return `<div class="bar"${i ? ' style="page-break-before:always"' : ""}>${i + 1}. ${esc((p.nombre || `Punto ${i + 1}`).toUpperCase())}</div>
<table class="chk"><tr><th style="width:52%">Aspecto a evaluar</th><th class="c">Cumple</th><th class="c">No cumple</th><th class="c">No aplica</th><th>Observaciones</th></tr>${filas}</table>
<table>${fila("Cumplimiento", pct(rp.cumplimiento), "Resultado de inspección", esc(resultado))}</table>`;
    })
    .join("");

  return documento(`${cabecera(`INSPECCIÓN DE ${esc(l.nombre.toUpperCase())} – LISTA DE VERIFICACIÓN`, esc(l.formato ?? ""))}
<table>
${fila("Fecha", fecha(e.fecha), "Sede / Área", esc(e.area))}
${fila("Responsable de la inspección", esc(e.elaboradoPor), "Responsable del área", esc(e.responsableArea))}
<tr><td class="lbl">Objetivo</td><td colspan="3">${esc(ins.objetivo)}</td></tr>
${fila("Cumplimiento total", pct(r.total.cumplimiento), "Resultado general", esc(r.resumen))}
</table>
${puntos}
<div class="bar">FIRMAS</div>
${tablaFirmas(firmasLocativa(ins))}`);
}

const marcaSiNo = (r: ReturnType<typeof siNo>, x: "SI" | "NO", malo: boolean) => `<td class="c${malo ? " crit" : ""}">${r === x ? "X" : ""}</td>`;

/** Bloque de un equipo en la ficha: datos del equipo y sus ítems por parte, con SI / NO. */
function bloqueFicha(q: Equipo, cat: CategoriaEquipo): string {
  const t = tipoDe(q, cat)!;
  const f = (iso?: string) => (iso ? fecha(iso) : "");
  const datos = t.lavado
    ? `${fila("Marca del equipo", esc(q.marca), "Fecha de último lavado", f(q.ultimoLavado))}
${fila("Fecha de fabricación", f(q.fabricacion), "Fecha de próximo lavado", f(q.proximoLavado))}
${fila("Número interno", esc(q.interno ?? ""), "Número de serie / lote", esc(q.serial))}`
    : `${fila("Marca del equipo", esc(q.marca), "Fecha de fabricación", f(q.fabricacion))}
${fila("Número interno", esc(q.interno ?? ""), "Número de serie", esc(q.serial))}
${fila("Fecha de última inspección anual", f(q.fechaPrueba), "Fecha de próxima inspección anual", cat.vigenciaMeses ? f(venceEl(q.fechaPrueba, cat.vigenciaMeses) ?? "") : "")}`;
  let k = 0;
  const filas = t.partes
    .map((p, ip) =>
      p.items
        .map((it, ii) => {
          const r = q.aspectos?.[k];
          const v = siNo(r, it.bueno);
          const obs = [q.obsAspectos?.[k], r === "NA" ? "No aplica" : ""].filter(Boolean).join(". ");
          k++;
          const equipo = ip === 0 && ii === 0 ? `<td rowspan="${t.partes.reduce((n, x) => n + x.items.length, 0)}" class="c" style="vertical-align:middle"><b>${esc(t.nombre.toUpperCase())}</b></td>` : "";
          const parte = ii === 0 ? `<td rowspan="${p.items.length}" style="vertical-align:middle"><b>${esc(p.nombre.toUpperCase())}</b></td>` : "";
          return `<tr>${equipo}${parte}<td${r === "NC" ? ' class="crit"' : ""}>${esc(it.texto)}</td>${marcaSiNo(v, "SI", r === "NC")}${marcaSiNo(v, "NO", r === "NC")}<td>${esc(obs)}</td></tr>`;
        })
        .join(""),
    )
    .join("");
  return `<div style="page-break-inside:avoid"><table>${datos}</table>
<table class="chk"><tr><th class="c" style="width:12%">Equipo</th><th style="width:16%">Partes</th><th>Aspectos a inspeccionar</th><th class="c">SI</th><th class="c">NO</th><th style="width:20%">Observaciones</th></tr>${filas}</table></div>`;
}

/** Fichas de los formatos SST-FO-085 / SST-FO-087: una hoja por propietario o kit. */
function hojaFicha(ins: InspeccionEquipos, formato: string, titular: string, equipos: { q: Equipo; cat: CategoriaEquipo }[], primera: boolean): string {
  const e = ins.encabezado;
  const traje = equipos.some((x) => tipoDe(x.q, x.cat)?.lavado);
  const titulo = traje ? "INSPECCIÓN DE TRAJE DE PROTECCIÓN CONTRA ARCO ELÉCTRICO" : "INSPECCIÓN DE EQUIPOS DE PROTECCIÓN CONTRA CAÍDAS";
  const cab = traje
    ? fila("Fecha de inspección", fecha(e.fecha), "Ubicación / subestación", esc(e.area)) + `<tr><td class="lbl">Kit N°</td><td colspan="3">${esc(titular)}</td></tr>`
    : fila("Fecha de inspección", fecha(e.fecha), "Propietario del equipo", esc(titular));
  const subestandar = equipos
    .filter(({ q, cat }) => aspectosNoConformes(q, cat).length || (q.resultado && q.resultado !== "Apto"))
    .map(({ q, cat }) => {
      const nc = aspectosNoConformes(q, cat);
      return `<tr><td>${esc(nombreEquipo({ ...q, titular: "" }) || tipoDe(q, cat)!.nombre)}: ${esc([q.hallazgo.trim() || q.condicion.trim(), ...nc].filter(Boolean).join("; "))}</td><td>${esc(q.accion)}</td><td>${esc(titular)}</td><td>${fecha(e.fecha)}</td></tr>`;
    })
    .join("");
  const res = equipos.map((x) => x.q.resultado);
  const apto = res.some((r) => r === "No apto") ? "NO" : res.length && res.every((r) => r === "Apto") ? "SI" : "";
  const firmantes = firmantesDe(ins);
  const clave = titular.trim().toLowerCase();
  const inspector = { firma: ins.firmas?.elaboro, cargo: `${traje ? "Quién inspecciona" : "Responsable de la inspección"} – ${e.cargoElaboro}`, nombre: e.elaboradoPor };
  const otro = traje
    ? firmantes.find((f) => f.rol === "Responsable presente")
    : firmantes.find((f) => f.rol === "Propietario del EPP" && f.nombre.trim().toLowerCase() === clave);
  const firmas = [
    ...(traje ? [{ firma: otro?.firma, cargo: "Responsable del equipo", nombre: otro?.nombre ?? "" }, inspector] : [inspector, { firma: otro?.firma, cargo: "Propietario del equipo", nombre: otro?.nombre ?? titular }]),
  ];
  return `<div${primera ? "" : ' style="page-break-before:always"'}>
${cabecera(titulo, esc(formato))}
<table>${cab}</table>
${equipos.map(({ q, cat }) => bloqueFicha(q, cat)).join("")}
<table class="chk"><tr><th style="width:40%">Condiciones subestándar</th><th>Acción requerida</th><th>Responsable</th><th>Fecha</th></tr>${subestandar || '<tr><td>Ninguna.</td><td></td><td></td><td></td></tr>'}</table>
<table><tr><td class="lbl">APTO PARA USO</td><td class="dec">SI ( ${apto === "SI" ? "X" : "&nbsp;"} )&nbsp;&nbsp;&nbsp; NO ( ${apto === "NO" ? '<span class="crit">X</span>' : "&nbsp;"} )</td></tr></table>
${tablaFirmas(firmas)}
</div>`;
}

/** Lista de verificación de las categorías sin ficha: matriz de aspectos × equipos. */
function matrizEquipos(s: SeccionEquipos, cat: CategoriaEquipo, n: number, primera: boolean): string {
  const leyenda = `<p>${cat.aspectos.map((a, k) => `<b>${k + 1}.</b> ${esc(a)}`).join(" ")}</p>`;
  const filas = s.equipos
    .map((q, k) => `<tr><td class="c">${k + 1}</td><td>${esc(nombreEquipo(q) || "Equipo")}${q.serial ? `<br><i>Serial ${esc(q.serial)}</i>` : ""}</td>${cat.aspectos.map((_, a) => celdaRespuesta(q.aspectos?.[a])).join("")}<td class="c ${q.resultado && q.resultado !== "Apto" ? "crit" : ""}">${esc(q.resultado ?? "")}</td></tr>`)
    .join("");
  return `<div class="bar"${primera ? "" : ' style="page-break-before:always"'}>${n}. ${esc(cat.nombre.toUpperCase())}</div>
${leyenda}
<table class="chk"><tr><th class="c">N°</th><th>Equipo</th>${cat.aspectos.map((_, k) => `<th class="c">${k + 1}</th>`).join("")}<th class="c">Resultado</th></tr>${filas}</table>`;
}

export function checklistEquiposHtml(ins: InspeccionEquipos): string {
  const e = ins.encabezado;
  // Las categorías con ficha se agrupan por formato y por titular: el traje y la capucha del mismo
  // kit salen en una sola hoja SST-FO-087, y los equipos contra caídas de cada dueño en una SST-FO-085.
  const fichas = new Map<string, Map<string, { titular: string; equipos: { q: Equipo; cat: CategoriaEquipo }[] }>>();
  for (const s of ins.secciones) {
    const cat = categoria(s.categoriaId);
    if (!cat.formatoFicha) continue;
    const grupo = fichas.get(cat.formatoFicha) ?? new Map();
    fichas.set(cat.formatoFicha, grupo);
    s.equipos.forEach((q) => {
      const k = q.titular.trim().toLowerCase() || q.id;
      const g = grupo.get(k) ?? { titular: q.titular.trim(), equipos: [] };
      g.equipos.push({ q, cat });
      grupo.set(k, g);
    });
  }

  const hechas = new Set<string>();
  let n = 0;
  let primera = true;
  const paginas: string[] = [];
  for (const s of ins.secciones) {
    const cat = categoria(s.categoriaId);
    if (!s.equipos.length) continue;
    if (cat.formatoFicha) {
      if (hechas.has(cat.formatoFicha)) continue;
      hechas.add(cat.formatoFicha);
      for (const g of fichas.get(cat.formatoFicha)!.values()) {
        paginas.push(hojaFicha(ins, cat.formatoFicha, g.titular, g.equipos, primera));
        primera = false;
      }
    } else {
      paginas.push(matrizEquipos(s, cat, ++n, false));
    }
  }

  const resumen = `${cabecera("INSPECCIÓN DE HERRAMIENTAS, EQUIPOS Y EPP – LISTAS DE VERIFICACIÓN")}
<table>
${fila("Fecha", fecha(e.fecha), "Sede / Área", esc(e.area))}
${fila("Responsable de la inspección", esc(e.elaboradoPor), "Responsable del área", esc(e.responsableArea))}
</table>
<p><i>C = cumple, NC = no cumple, NA = no aplica.</i></p>`;
  const conMatriz = ins.secciones.some((s) => s.equipos.length && !categoria(s.categoriaId).formatoFicha);
  // Si solo hay fichas, cada una ya trae su encabezado y sus firmas.
  if (!conMatriz) return documento(paginas.join(""));
  const matrices = paginas.filter((p) => p.startsWith('<div class="bar"'));
  const hojas = paginas.filter((p) => !p.startsWith('<div class="bar"'));
  return documento(`${resumen}
${matrices.map((m, i) => (i === 0 ? m.replace(' style="page-break-before:always"', "") : m)).join("")}
<div class="bar">FIRMAS</div>
${tablaFirmas(firmasEquipos(ins))}
${hojas.map((h) => h.replace(/^<div>/, '<div style="page-break-before:always">')).join("")}`);
}

export const nombreArchivoChecklist = (base: string) => base.replace(/\.pdf$/, "_checklist.pdf");
