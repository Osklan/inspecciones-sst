// Inspección de herramientas, equipos y EPP: una categoría a la vez, Apto / No apto / En prueba por equipo.
import { Stack, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { CategoriaEquipo, FormatoTabla } from "@/data/categoriasEquipos";
import { exportarPdf } from "@/media/exportar";
import { borrarFoto } from "@/media/fotos";
import {
  calcularEquipos,
  categoria,
  faltantes,
  nombreEquipo,
  nuevoEquipo,
  venceEl,
  vigencia,
  type Equipo,
  type EstadoHallazgo,
  type InspeccionEquipos,
  type SeccionEquipos,
} from "@/domain/equipos";
import { tituloInspeccion } from "@/domain/inspeccion";
import type { ResultadoEquipo } from "@/domain/tipos";
import { guardar, obtener } from "@/db/inspecciones";
import { FotosEvidencia } from "@/ui/FotosEvidencia";
import { PanelFirma } from "@/ui/PanelFirma";
import { color, est } from "@/ui/tema";

type Campo = keyof Pick<Equipo, "titular" | "elemento" | "marca" | "serial" | "condicion" | "fechaPrueba" | "codigoPrueba">;

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
  const [exportando, setExportando] = useState(false);
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

  async function exportar() {
    if (!ins) return;
    if (res!.sinResultado) {
      Alert.alert("Inspección incompleta", `Faltan ${res!.sinResultado} equipos sin resultado. Márcalos como Apto, No apto o En prueba antes de generar el informe.`);
      return;
    }
    setExportando(true);
    try {
      await guardar(db, ins);
      await exportarPdf(ins);
    } catch (e) {
      Alert.alert("No se pudo generar el PDF", String((e as Error).message ?? e));
    } finally {
      setExportando(false);
    }
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
        titulo={`Elaboró – ${ins.encabezado.cargoElaboro}`}
        nombre={ins.encabezado.elaboradoPor}
        firma={ins.firmas?.elaboro}
        onFirmando={setFirmando}
        onCambio={(f) => actualizar((x) => ({ ...x, firmas: { ...x.firmas, elaboro: f } }))}
      />
      <PanelFirma
        titulo={`Revisó – ${ins.encabezado.cargoReviso}`}
        nombre={ins.encabezado.revisadoPor}
        firma={ins.firmas?.reviso}
        onFirmando={setFirmando}
        onCambio={(f) => actualizar((x) => ({ ...x, firmas: { ...x.firmas, reviso: f } }))}
      />

      <Pressable style={[est.boton, exportando && { opacity: 0.6 }]} disabled={exportando} onPress={exportar}>
        <Text style={est.botonTexto}>{exportando ? "Generando PDF…" : "Generar informe PDF y compartir"}</Text>
      </Pressable>
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
  const set = (k: Campo, v: string) => onCambio((x) => ({ ...x, [k]: v }));

  return (
    <View style={[est.tarjeta, { borderLeftWidth: 4, borderLeftColor: tintaResultado(e.resultado) }]}>
      <Pressable onPress={onAbrir} style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        <View style={{ flexShrink: 1 }}>
          <Text style={est.texto}>{n}. {nombreEquipo(e) || "Equipo sin nombre"}</Text>
          <Text style={est.tenue}>
            {e.resultado ?? "Sin resultado"}
            {falta.length ? ` · faltan ${falta.length}` : ""}
            {vig === "vencida" ? " · prueba vencida" : vig === "sin registro" ? " · sin fecha de prueba" : ""}
            {e.fotos.length ? ` · ${e.fotos.length} foto(s)` : ""}
          </Text>
        </View>
        <Text style={[est.subtitulo, { color: color.tenue }]}>{abierto ? "▲" : "▼"}</Text>
      </Pressable>

      {abierto && (
        <View style={{ gap: 8 }}>
          {CAMPOS[cat.formato].map(([k, label]) => (
            <View key={k} style={{ gap: 4 }}>
              <Text style={est.etiqueta}>{label}</Text>
              <TextInput style={est.input} value={e[k]} onChangeText={(v) => set(k, v)} multiline={k === "condicion"} />
            </View>
          ))}
          {cat.vigenciaMeses && (
            <Text style={[est.tenue, vig === "vencida" && { color: color.rojo, fontWeight: "700" }]}>
              {vig === "sin registro"
                ? "Sin fecha de prueba registrada."
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
