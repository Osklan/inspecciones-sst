// Inspección de herramientas, equipos y EPP: una categoría a la vez, Apto / No apto / En prueba por equipo.
import { Stack, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { CategoriaEquipo, FormatoTabla } from "@/data/categoriasEquipos";
import type { Documento } from "@/media/exportar";
import { borrarFoto } from "@/media/fotos";
import {
  aspectosDe,
  aspectosSinMarcar,
  tipoDe,
  calcularEquipos,
  categoria,
  faltantes,
  firmantesDe,
  nombreEquipo,
  nuevoEquipo,
  venceEl,
  vigencia,
  type Equipo,
  type EstadoHallazgo,
  type Firmante,
  type InspeccionEquipos,
  type SeccionEquipos,
} from "@/domain/equipos";
import { tituloInspeccion, type Inspeccion } from "@/domain/inspeccion";
import type { ResultadoEquipo } from "@/domain/tipos";
import { guardar, obtener } from "@/db/inspecciones";
import { FotosEvidencia } from "@/ui/FotosEvidencia";
import { OpcionesRespuesta } from "@/ui/OpcionesRespuesta";
import { BotonesExportar } from "@/ui/BotonesExportar";
import { PanelFirma } from "@/ui/PanelFirma";
import { color, est } from "@/ui/tema";

type Campo = keyof Pick<Equipo, "titular" | "elemento" | "marca" | "serial" | "condicion" | "fechaPrueba" | "codigoPrueba" | "interno" | "fabricacion" | "ultimoLavado" | "proximoLavado">;

// Campos que se piden según el formato de la tabla del informe.
const CAMPOS: Record<FormatoTabla, [Campo, string][]> = {
  inventario: [["titular", "Titular"], ["elemento", "Elemento"], ["marca", "Marca"], ["serial", "Serial"], ["condicion", "Observación (opcional)"]],
  kit: [["titular", "Trabajador"], ["condicion", "Observación (opcional)"]],
  condicion: [["titular", "Kit N°"], ["elemento", "Equipo"], ["marca", "Marca"], ["serial", "Serial"], ["condicion", "Condición observada"]],
  certificado: [["titular", "Asignado a"], ["elemento", "Equipo (marca, clase)"], ["fechaPrueba", "Última prueba (AAAA-MM-DD)"], ["codigoPrueba", "Código de prueba"], ["condicion", "Observación (opcional)"]],
  inspeccionAnual: [["elemento", "Equipo"], ["serial", "Serial"], ["fechaPrueba", "Última inspección anual (AAAA-MM-DD)"], ["condicion", "Condición observada"]],
};

const RESULTADOS: ResultadoEquipo[] = ["Apto", "No apto", "En prueba"];
const ESTADOS: EstadoHallazgo[] = ["Abierto", "En proceso", "Cerrado"];
const tintaResultado = (r?: ResultadoEquipo) => (r === "Apto" ? color.verde : r === "No apto" ? color.rojo : r ? color.ambar : color.tenue);
const fondoResultado = (r: ResultadoEquipo) => (r === "Apto" ? color.verdeFondo : r === "No apto" ? color.rojoFondo : color.ambarFondo);

export default function InspeccionEquiposPantalla() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [ins, setIns] = useState<InspeccionEquipos | null>(null);
  const [sel, setSel] = useState(0);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [firmando, setFirmando] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { obtener(db, id).then((x) => setIns(x?.tipo === "equipos" ? x : null)); }, [db, id]);

  // Guardado automático medio segundo después del último cambio.
  function actualizar(cambio: (x: InspeccionEquipos) => InspeccionEquipos) {
    setIns((x) => {
      if (!x) return x;
      const n = cambio(x);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => guardar(db, n), 500);
      return n;
    });
  }

  const res = useMemo(() => (ins ? calcularEquipos(ins) : null), [ins]);
  if (!ins || !res) return <View style={est.pantalla} />;
  const i = Math.min(sel, ins.secciones.length - 1);
  const s = ins.secciones[i];
  const cat = categoria(s.categoriaId);

  const cambiarSeccion = (cambio: (s: SeccionEquipos) => SeccionEquipos) =>
    actualizar((x) => ({ ...x, secciones: x.secciones.map((q, k) => (k === i ? cambio(q) : q)) }));
  const cambiarEquipo = (eid: string, cambio: (e: Equipo) => Equipo) =>
    cambiarSeccion((q) => ({ ...q, equipos: q.equipos.map((e) => (e.id === eid ? cambio(e) : e)) }));

  const firmantes = firmantesDe(ins);
  // Se guarda la lista completa para conservar las firmas aunque cambien los titulares.
  const guardarFirmantes = (f: (l: Firmante[]) => Firmante[]) => actualizar((x) => ({ ...x, firmantes: f(firmantesDe(x)) }));
  const cambiarFirmante = (f: Firmante, cambio: Partial<Firmante>) =>
    guardarFirmantes((l) => l.map((x) => (x.id === f.id ? { ...x, ...cambio } : x)));
  const quitarFirmante = (f: Firmante) => guardarFirmantes((l) => l.filter((x) => x.id !== f.id));
  const agregarPresente = () =>
    guardarFirmantes((l) => [...l, { id: `presente-${Date.now().toString(36)}`, nombre: "", rol: "Responsable presente" }]);

  function agregar(base?: Equipo) {
    const nuevo = { ...nuevoEquipo(`${ins!.id}-${Date.now().toString(36)}`, cat) };
    if (base) Object.assign(nuevo, { elemento: base.elemento, marca: base.marca, fechaPrueba: base.fechaPrueba, condicion: base.condicion });
    cambiarSeccion((q) => ({ ...q, equipos: [...q.equipos, nuevo] }));
    setAbierto(nuevo.id);
  }

  function eliminar(e: Equipo) {
    Alert.alert("Eliminar equipo", `¿Eliminar «${nombreEquipo(e) || "equipo sin nombre"}» y sus fotos?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar", style: "destructive", onPress: () => {
          e.fotos.forEach(borrarFoto);
          cambiarSeccion((q) => ({ ...q, equipos: q.equipos.filter((x) => x.id !== e.id) }));
        },
      },
    ]);
  }

  async function preparar(doc: Documento): Promise<Inspeccion | null> {
    if (!ins) return null;
    if (res!.sinResultado) {
      Alert.alert("Inspección incompleta", `Faltan ${res!.sinResultado} equipos sin resultado. Márcalos como Apto, No apto o En prueba antes de generar el informe.`);
      return null;
    }
    const sinMarcar = aspectosSinMarcar(ins);
    if (doc === "checklist" && sinMarcar) {
      Alert.alert("Lista incompleta", `Faltan ${sinMarcar} aspectos por marcar en las listas de verificación de los equipos. Usa «Todo cumple» en cada equipo para marcar rápido los que están bien.`);
      return null;
    }
    await guardar(db, ins);
    return ins;
  }

  return (
    <ScrollView style={est.pantalla} contentContainerStyle={est.contenido} keyboardShouldPersistTaps="handled" scrollEnabled={!firmando}>
      <Stack.Screen options={{ title: tituloInspeccion(ins) }} />

      <View style={[est.tarjeta, res.hallazgos.length || res.vencidas ? { borderColor: color.ambar, backgroundColor: color.ambarFondo } : null]}>
        <Text style={est.subtitulo}>Resultado</Text>
        <Text style={est.texto}>
          {res.total} equipos · {res.porResultado.Apto} aptos · {res.porResultado["No apto"]} no aptos · {res.porResultado["En prueba"]} en prueba
          {res.sinResultado ? ` · ${res.sinResultado} sin marcar` : ""}
        </Text>
        {res.vencidas > 0 && <Text style={[est.texto, { color: color.rojo, fontWeight: "700" }]}>{res.vencidas} con prueba o inspección anual vencida</Text>}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {ins.secciones.map((q, k) => {
          const pendientes = q.equipos.filter((e) => !e.resultado).length;
          return (
            <Pressable key={q.categoriaId} onPress={() => setSel(k)} style={[est.input, { paddingVertical: 8, maxWidth: 220 }, k === i && { borderColor: color.azul, backgroundColor: color.tinte }]}>
              <Text style={est.texto} numberOfLines={1}>{categoria(q.categoriaId).nombre}{pendientes ? ` (${pendientes})` : " ✓"}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={est.titulo}>{cat.nombre}</Text>
      {cat.formato === "certificado" && (
        <View style={est.tarjeta}>
          <Text style={est.etiqueta}>Laboratorio de las pruebas</Text>
          <TextInput style={est.input} placeholder="Ej.: Testlab SAS" value={s.laboratorio} onChangeText={(v) => cambiarSeccion((q) => ({ ...q, laboratorio: v }))} />
        </View>
      )}

      {s.equipos.map((e, k) => (
        <TarjetaEquipo
          key={e.id}
          n={k + 1}
          e={e}
          cat={cat}
          fechaInspeccion={ins.encabezado.fecha}
          abierto={abierto === e.id}
          onAbrir={() => setAbierto(abierto === e.id ? null : e.id)}
          onCambio={(c) => cambiarEquipo(e.id, c)}
          onDuplicar={() => agregar(e)}
          onEliminar={() => eliminar(e)}
        />
      ))}

      <Pressable style={[est.input, { alignItems: "center" }]} onPress={() => agregar()}>
        <Text style={[est.texto, { color: color.azul, fontWeight: "700" }]}>+ Agregar {cat.formato === "kit" ? "kit de un trabajador" : "equipo"}</Text>
      </Pressable>

      <View style={est.tarjeta}>
        <Text style={est.etiqueta}>Resultados de {cat.nombre.toLowerCase()} (texto)</Text>
        <Text style={est.tenue}>Resumen de lo encontrado en esta categoría. La tabla se agrega sola.</Text>
        <TextInput style={[est.input, { minHeight: 70 }]} multiline value={s.texto} onChangeText={(v) => cambiarSeccion((q) => ({ ...q, texto: v }))} />
      </View>

      {i < ins.secciones.length - 1 && (
        <Pressable style={est.boton} onPress={() => { setSel(i + 1); setAbierto(null); }}>
          <Text style={est.botonTexto}>Siguiente categoría →</Text>
        </Pressable>
      )}

      <View style={est.tarjeta}>
        <Text style={est.subtitulo}>Fotos de la visita</Text>
        <Text style={est.tenue}>Evidencia de control operacional, haya o no hallazgos. Sale al final del anexo fotográfico del informe.</Text>
        <FotosEvidencia fotos={ins.fotosVisita ?? []} onCambio={(c) => actualizar((x) => ({ ...x, fotosVisita: c(x.fotosVisita ?? []) }))} />
      </View>

      <View style={est.tarjeta}>
        <Text style={est.subtitulo}>Textos del informe</Text>
        {([["objetivo", "Objetivo", ""], ["conclusiones", "Conclusiones", "Una por línea."], ["recomendaciones", "Recomendaciones", "Una por línea."]] as const).map(([k, label, ayuda]) => (
          <View key={k} style={{ gap: 4 }}>
            <Text style={est.etiqueta}>{label}</Text>
            {!!ayuda && <Text style={est.tenue}>{ayuda}</Text>}
            <TextInput style={[est.input, { minHeight: 80 }]} multiline value={ins[k]} onChangeText={(v) => actualizar((x) => ({ ...x, [k]: v }))} />
          </View>
        ))}
      </View>

      <PanelFirma
        titulo={`Inspeccionó – ${ins.encabezado.cargoElaboro}`}
        nombre={ins.encabezado.elaboradoPor}
        firma={ins.firmas?.elaboro}
        onFirmando={setFirmando}
        onCambio={(f) => actualizar((x) => ({ ...x, firmas: { ...x.firmas, elaboro: f } }))}
      />

      <View style={est.tarjeta}>
        <Text style={est.subtitulo}>Firmas de quienes reciben la inspección</Text>
        <Text style={est.tenue}>
          Cada propietario firma por su EPP. En los equipos de uso común (trajes, caretas, pértigas, herramientas) firma quien estuvo presente.
        </Text>
      </View>
      {firmantes.map((f) => (
        <View key={f.id} style={{ gap: 6 }}>
          {f.rol === "Responsable presente" && (
            <View style={[est.tarjeta, { gap: 6 }]}>
              <Text style={est.etiqueta}>Nombre del responsable presente</Text>
              <TextInput style={est.input} value={f.nombre} onChangeText={(v) => cambiarFirmante(f, { nombre: v })} />
              {firmantes.filter((x) => x.rol === "Responsable presente").length > 1 && (
                <Pressable onPress={() => quitarFirmante(f)}>
                  <Text style={[est.tenue, { color: color.rojo }]}>Quitar esta persona</Text>
                </Pressable>
              )}
            </View>
          )}
          <PanelFirma
            titulo={f.rol}
            nombre={f.nombre}
            firma={f.firma}
            onFirmando={setFirmando}
            onCambio={(firma) => cambiarFirmante(f, { firma })}
          />
        </View>
      ))}
      <Pressable style={[est.input, { alignItems: "center" }]} onPress={agregarPresente}>
        <Text style={[est.texto, { color: color.azul, fontWeight: "700" }]}>+ Agregar otra persona presente</Text>
      </Pressable>

      <BotonesExportar preparar={preparar} />
    </ScrollView>
  );
}

interface TarjetaProps {
  n: number;
  e: Equipo;
  cat: CategoriaEquipo;
  fechaInspeccion: string;
  abierto: boolean;
  onAbrir: () => void;
  onCambio: (c: (e: Equipo) => Equipo) => void;
  onDuplicar: () => void;
  onEliminar: () => void;
}

function TarjetaEquipo({ n, e, cat, fechaInspeccion, abierto, onAbrir, onCambio, onDuplicar, onEliminar }: TarjetaProps) {
  const vig = vigencia(e, cat, fechaInspeccion);
  const falta = faltantes(e, cat);
  const aspectos = aspectosDe(e, cat);
  const pendientes = aspectos.filter((_, k) => !e.aspectos?.[k]).length;
  const set = (k: Campo, v: string) => onCambio((x) => ({ ...x, [k]: v }));
  const tipo = tipoDe(e, cat);
  // Datos de la ficha del formato (SST-FO-085 / SST-FO-087) que no pide la tabla del informe.
  const campos: [Campo, string][] = [...CAMPOS[cat.formato]];
  if (tipo) {
    const hay = new Set(campos.map(([k]) => k));
    const extra: [Campo, string][] = [
      ["marca", "Marca"],
      ["serial", tipo.lavado ? "N° de serie / lote" : "N° de serie"],
      ["interno", "N° interno"],
      ["fabricacion", "Fecha de fabricación (AAAA-MM-DD)"],
      ...(cat.vigenciaMeses ? [["fechaPrueba", "Última inspección anual (AAAA-MM-DD)"] as [Campo, string]] : []),
      ...(tipo.lavado ? [["ultimoLavado", "Fecha de último lavado (AAAA-MM-DD)"], ["proximoLavado", "Fecha de próximo lavado (AAAA-MM-DD)"]] as [Campo, string][] : []),
    ];
    campos.splice(campos.findIndex(([k]) => k === "condicion"), 0, ...extra.filter(([k]) => !hay.has(k)));
  }

  return (
    <View style={[est.tarjeta, { borderLeftWidth: 4, borderLeftColor: tintaResultado(e.resultado) }]}>
      <Pressable onPress={onAbrir} style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        <View style={{ flexShrink: 1 }}>
          <Text style={est.texto}>{n}. {nombreEquipo(e) || "Equipo sin nombre"}</Text>
          <Text style={est.tenue}>
            {e.resultado ?? "Sin resultado"}
            {pendientes ? ` · ${pendientes} aspectos sin marcar` : ""}
            {falta.length ? ` · faltan ${falta.length}` : ""}
            {vig === "vencida" ? " · prueba vencida" : vig === "sin registro" ? " · sin fecha de prueba" : ""}
            {e.fotos.length ? ` · ${e.fotos.length} foto(s)` : ""}
          </Text>
        </View>
        <Text style={[est.subtitulo, { color: color.tenue }]}>{abierto ? "▲" : "▼"}</Text>
      </Pressable>

      {abierto && (
        <View style={{ gap: 8 }}>
          {(cat.tiposElemento?.length ?? 0) > 1 && (
            <View style={{ gap: 4 }}>
              <Text style={est.etiqueta}>Ficha del formato {cat.formatoFicha}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {cat.tiposElemento!.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => t.id !== tipo?.id && onCambio((x) => ({ ...x, tipoElemento: t.id, aspectos: {}, obsAspectos: {}, elemento: x.elemento || t.nombre }))}
                    style={[est.input, { paddingVertical: 6 }, tipo?.id === t.id && { borderColor: color.azul, backgroundColor: color.tinte }]}
                  >
                    <Text style={est.texto}>{t.nombre}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          {campos.map(([k, label]) => (
            <View key={k} style={{ gap: 4 }}>
              <Text style={est.etiqueta}>{label}</Text>
              <TextInput style={est.input} value={e[k] ?? ""} onChangeText={(v) => set(k, v)} multiline={k === "condicion"} />
            </View>
          ))}
          {cat.vigenciaMeses && (
            <Text style={[est.tenue, vig === "vencida" && { color: color.rojo, fontWeight: "700" }]}>
              {vig === "sin registro"
                ? "Sin fecha registrada."
                : `Vigencia de ${cat.vigenciaMeses} meses: vence el ${venceEl(e.fechaPrueba, cat.vigenciaMeses)!.split("-").reverse().join("/")}${vig === "vencida" ? " (vencida)" : ""}.`}
            </Text>
          )}

          {cat.formato === "kit" && (
            <View style={{ gap: 6 }}>
              <Text style={est.etiqueta}>Componentes del kit (toca para marcar faltantes)</Text>
              {(cat.componentes ?? []).map((c, k) => {
                const tiene = e.componentes?.[k] !== false;
                return (
                  <Pressable
                    key={k}
                    onPress={() => onCambio((x) => ({ ...x, componentes: { ...x.componentes, [k]: !tiene } }))}
                    style={[est.input, { paddingVertical: 8 }, !tiene && { borderColor: color.rojo, backgroundColor: color.rojoFondo }]}
                  >
                    <Text style={[est.texto, !tiene && { color: color.rojo }]}>{tiene ? "☑" : "☐ Falta:"}  {c}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={est.etiqueta}>{tipo ? `Ficha ${cat.formatoFicha} – ${tipo.nombre}` : "Lista de verificación"}</Text>
              {pendientes > 0 && (
                <Pressable onPress={() => onCambio((x) => ({ ...x, aspectos: Object.fromEntries(aspectos.map((_, k) => [k, x.aspectos?.[k] ?? "C"])) }))} style={[est.input, { paddingVertical: 6 }]}>
                  <Text style={est.texto}>Todo cumple ({pendientes})</Text>
                </Pressable>
              )}
            </View>
            {tipo && <Text style={est.tenue}>Responde SI o NO a lo que dice cada ítem; la app sabe cuáles respuestas son un defecto.</Text>}
            {aspectos.map((a, k) => (
              <View key={k} style={{ gap: 4 }}>
                {a.parte && a.parte !== aspectos[k - 1]?.parte && <Text style={[est.subtitulo, { marginTop: 4 }]}>{a.parte}</Text>}
                <Text style={est.texto}>{k + 1}. {a.texto}</Text>
                <OpcionesRespuesta bueno={a.bueno} valor={e.aspectos?.[k]} onElegir={(o) => onCambio((x) => ({ ...x, aspectos: { ...x.aspectos, [k]: o } }))} />
                {tipo && e.aspectos?.[k] === "NC" && (
                  <TextInput
                    style={est.input}
                    placeholder="Observación (sale en la ficha)"
                    value={e.obsAspectos?.[k] ?? ""}
                    onChangeText={(v) => onCambio((x) => ({ ...x, obsAspectos: { ...x.obsAspectos, [k]: v } }))}
                  />
                )}
              </View>
            ))}
          </View>

          <Text style={est.etiqueta}>Resultado</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {RESULTADOS.map((r) => {
              const on = e.resultado === r;
              return (
                <Pressable key={r} onPress={() => onCambio((x) => ({ ...x, resultado: r }))} style={[est.input, { flex: 1, alignItems: "center", paddingHorizontal: 4 }, on && { backgroundColor: fondoResultado(r), borderColor: tintaResultado(r) }]}>
                  <Text style={[est.texto, { fontWeight: "700", color: on ? tintaResultado(r) : color.tinta }]}>{r}</Text>
                </Pressable>
              );
            })}
          </View>

          {e.resultado && e.resultado !== "Apto" && (
            <View style={{ gap: 6 }}>
              <Text style={est.subtitulo}>Hallazgo</Text>
              <Text style={est.etiqueta}>Qué se encontró</Text>
              <TextInput style={[est.input, { minHeight: 60 }]} multiline placeholder="Si lo dejas vacío, se usa la condición observada." value={e.hallazgo} onChangeText={(v) => onCambio((x) => ({ ...x, hallazgo: v }))} />
              <Text style={est.etiqueta}>Riesgo asociado</Text>
              <TextInput style={[est.input, { minHeight: 50 }]} multiline value={e.riesgo} onChangeText={(v) => onCambio((x) => ({ ...x, riesgo: v }))} />
              <Text style={est.etiqueta}>Acción recomendada</Text>
              <TextInput style={[est.input, { minHeight: 50 }]} multiline value={e.accion} onChangeText={(v) => onCambio((x) => ({ ...x, accion: v }))} />
              <Text style={est.etiqueta}>Estado</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {ESTADOS.map((s) => (
                  <Pressable key={s} onPress={() => onCambio((x) => ({ ...x, estado: s }))} style={[est.input, { flex: 1, alignItems: "center", paddingHorizontal: 4 }, e.estado === s && { borderColor: color.azul, backgroundColor: color.tinte }]}>
                    <Text style={est.texto}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <Text style={est.etiqueta}>Fotos</Text>
          <FotosEvidencia fotos={e.fotos} onCambio={(c) => onCambio((x) => ({ ...x, fotos: c(x.fotos) }))} />

          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={onEliminar} style={[est.input, { flex: 1, alignItems: "center" }]}>
              <Text style={[est.texto, { color: color.rojo }]}>Eliminar</Text>
            </Pressable>
            <Pressable onPress={onDuplicar} style={[est.input, { flex: 1, alignItems: "center" }]}>
              <Text style={est.texto}>Duplicar</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
