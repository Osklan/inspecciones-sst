// Inspección de botiquines (SST-FO-077): un botiquín a la vez, cantidad, estado y vencimiento por elemento.
import { Stack, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ELEMENTOS_BOTIQUIN } from "@/data/botiquin";
import {
  calcularBotiquines,
  nuevoBotiquin,
  type Botiquin,
  type EstadoElemento,
  type InspeccionBotiquines,
  type Novedad,
  type RegistroElemento,
} from "@/domain/botiquines";
import { tituloInspeccion, type Inspeccion } from "@/domain/inspeccion";
import { guardar, obtener } from "@/db/inspecciones";
import type { Documento } from "@/media/exportar";
import { borrarFoto } from "@/media/fotos";
import { BotonesExportar } from "@/ui/BotonesExportar";
import { FotosEvidencia } from "@/ui/FotosEvidencia";
import { PanelFirma } from "@/ui/PanelFirma";
import { color, est } from "@/ui/tema";

const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)} %`);
const ESTADOS: EstadoElemento[] = ["Bueno", "Malo"];
const NOVEDAD: Record<Novedad, string> = { falta: "Bajo el mínimo", malo: "Mal estado", vencido: "Vencido", "por vencer": "Próximo a vencer" };
const REGISTRO_VACIO: RegistroElemento = { cantidad: "", vence: "", observacion: "" };

export default function InspeccionBotiquinesPantalla() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [ins, setIns] = useState<InspeccionBotiquines | null>(null);
  const [sel, setSel] = useState(0);
  const [firmando, setFirmando] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { obtener(db, id).then((x) => setIns(x?.tipo === "botiquines" ? x : null)); }, [db, id]);

  // Guardado automático medio segundo después del último cambio.
  function actualizar(cambio: (x: InspeccionBotiquines) => InspeccionBotiquines) {
    setIns((x) => {
      if (!x) return x;
      const n = cambio(x);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => guardar(db, n), 500);
      return n;
    });
  }

  const res = useMemo(() => (ins ? calcularBotiquines(ins) : null), [ins]);
  if (!ins || !res) return <View style={est.pantalla} />;
  const i = Math.min(sel, ins.botiquines.length - 1);
  const b = ins.botiquines[i];
  const rb = res.botiquines[i];

  const cambiarBotiquin = (cambio: (b: Botiquin) => Botiquin) =>
    actualizar((x) => ({ ...x, botiquines: x.botiquines.map((q) => (q.id === b.id ? cambio(q) : q)) }));
  const cambiarElemento = (k: number, cambio: Partial<RegistroElemento>) =>
    cambiarBotiquin((q) => ({ ...q, elementos: { ...q.elementos, [k]: { ...REGISTRO_VACIO, ...q.elementos[k], ...cambio } } }));
  const completarPendientes = () =>
    cambiarBotiquin((q) => ({
      ...q,
      elementos: Object.fromEntries(
        ELEMENTOS_BOTIQUIN.map((el, k) => {
          const r = q.elementos[k] ?? REGISTRO_VACIO;
          return [k, { ...r, cantidad: r.cantidad || String(el.minimo), estado: r.estado ?? "Bueno" }];
        }),
      ),
    }));

  function agregarBotiquin() {
    actualizar((x) => ({ ...x, botiquines: [...x.botiquines, nuevoBotiquin(`${x.id}-${Date.now().toString(36)}`)] }));
    setSel(ins!.botiquines.length);
  }

  function eliminarBotiquin() {
    Alert.alert("Eliminar botiquín", `¿Eliminar «${b.area || `Botiquín ${i + 1}`}» y sus fotos?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar", style: "destructive", onPress: () => {
          b.fotos.forEach(borrarFoto);
          actualizar((x) => ({ ...x, botiquines: x.botiquines.filter((q) => q.id !== b.id) }));
          setSel(Math.max(0, i - 1));
        },
      },
    ]);
  }

  async function preparar(_doc: Documento): Promise<Inspeccion | null> {
    if (!ins) return null;
    const sinArea = ins.botiquines.findIndex((q) => !q.area.trim());
    if (sinArea >= 0) {
      setSel(sinArea);
      Alert.alert("Falta el área", "Escribe el área o ubicación de cada botiquín antes de generar el PDF.");
      return null;
    }
    if (res!.sinDiligenciar) {
      Alert.alert("Inspección incompleta", `Faltan ${res!.sinDiligenciar} elementos por registrar (cantidad y estado). Complétalos antes de generar el PDF.`);
      return null;
    }
    await guardar(db, ins);
    return ins;
  }

  let grupo = "";

  return (
    <ScrollView style={est.pantalla} contentContainerStyle={est.contenido} keyboardShouldPersistTaps="handled" scrollEnabled={!firmando}>
      <Stack.Screen options={{ title: tituloInspeccion(ins) }} />

      <View style={[est.tarjeta, res.conHallazgo.length ? { borderColor: color.ambar, backgroundColor: color.ambarFondo } : null]}>
        <Text style={est.subtitulo}>Resultado</Text>
        <Text style={est.texto}>Cumplimiento: {pct(res.cumplimiento)}</Text>
        <Text style={est.texto}>{res.resumen}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {ins.botiquines.map((q, k) => {
          const r = res.botiquines[k];
          const nov = r.faltantes + r.malos + r.vencidos;
          return (
            <Pressable key={q.id} onPress={() => setSel(k)} style={[est.input, { paddingVertical: 8, maxWidth: 180 }, k === i && { borderColor: color.azul, backgroundColor: color.tinte }]}>
              <Text style={est.texto} numberOfLines={1}>
                {q.area || `Botiquín ${k + 1}`}{r.sinDiligenciar ? ` (${r.sinDiligenciar})` : nov ? ` · ${nov} novedades` : " ✓"}
              </Text>
            </Pressable>
          );
        })}
        <Pressable onPress={agregarBotiquin} style={[est.input, { paddingVertical: 8 }]}>
          <Text style={[est.texto, { color: color.azul, fontWeight: "700" }]}>+ Botiquín</Text>
        </Pressable>
      </ScrollView>

      <View style={est.tarjeta}>
        <Text style={est.etiqueta}>Área o ubicación del botiquín</Text>
        <TextInput style={est.input} placeholder="Ej.: Almacén frente LEGGO" value={b.area} onChangeText={(v) => cambiarBotiquin((q) => ({ ...q, area: v }))} />
        <Text style={est.etiqueta}>Responsable del botiquín</Text>
        <TextInput style={est.input} value={b.responsable} onChangeText={(v) => cambiarBotiquin((q) => ({ ...q, responsable: v }))} />
        {rb.sinDiligenciar > 0 && (
          <Pressable onPress={completarPendientes} style={[est.input, { alignItems: "center" }]}>
            <Text style={est.texto}>Marcar los {rb.sinDiligenciar} pendientes con la cantidad mínima y en buen estado</Text>
          </Pressable>
        )}
      </View>

      {ELEMENTOS_BOTIQUIN.map((el, k) => {
        const r = b.elementos[k];
        const ev = rb.elementos[k];
        const titulo = el.grupo !== grupo ? el.grupo : null;
        grupo = el.grupo;
        const alerta = ev.novedades.some((n) => n !== "por vencer");
        return (
          <View key={k} style={{ gap: 8 }}>
            {titulo && <Text style={[est.subtitulo, { marginTop: 4 }]}>{titulo}</Text>}
            <View style={[est.tarjeta, alerta && { borderColor: color.rojo }]}>
              <Text style={est.texto}>{el.contenido}</Text>
              <Text style={est.tenue}>Cantidad mínima: {el.minima}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={est.etiqueta}>Cantidad encontrada</Text>
                  <TextInput style={est.input} keyboardType="numeric" value={r?.cantidad ?? ""} onChangeText={(v) => cambiarElemento(k, { cantidad: v })} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={est.etiqueta}>Vence (AAAA-MM-DD)</Text>
                  <TextInput style={est.input} placeholder="Si no vence, vacío" value={r?.vence ?? ""} onChangeText={(v) => cambiarElemento(k, { vence: v })} />
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {ESTADOS.map((s) => {
                  const on = r?.estado === s;
                  const tinta = s === "Bueno" ? color.verde : color.rojo;
                  return (
                    <Pressable key={s} onPress={() => cambiarElemento(k, { estado: s })} style={[est.input, { flex: 1, alignItems: "center" }, on && { borderColor: tinta, backgroundColor: s === "Bueno" ? color.verdeFondo : color.rojoFondo }]}>
                      <Text style={[est.texto, { fontWeight: "700", color: on ? tinta : color.tinta }]}>{s}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {ev.novedades.length > 0 && (
                <Text style={[est.tenue, { color: alerta ? color.rojo : color.ambar, fontWeight: "700" }]}>{ev.novedades.map((n) => NOVEDAD[n]).join(" · ")}</Text>
              )}
              <TextInput style={est.input} placeholder="Observación" value={r?.observacion ?? ""} onChangeText={(v) => cambiarElemento(k, { observacion: v })} />
            </View>
          </View>
        );
      })}

      <View style={est.tarjeta}>
        <Text style={est.subtitulo}>Resultado de este botiquín</Text>
        {!!rb.hallazgo && <Text style={[est.texto, { color: color.rojo }]}>{rb.hallazgo}</Text>}
        <Text style={est.etiqueta}>Resultado de inspección</Text>
        <TextInput style={[est.input, { minHeight: 60 }]} multiline placeholder="Si lo dejas vacío, se usan las novedades encontradas." value={b.resultado} onChangeText={(v) => cambiarBotiquin((q) => ({ ...q, resultado: v }))} />
        <Text style={est.etiqueta}>Acción recomendada</Text>
        <TextInput style={[est.input, { minHeight: 50 }]} multiline value={b.accion} onChangeText={(v) => cambiarBotiquin((q) => ({ ...q, accion: v }))} />
        <Text style={est.etiqueta}>Fotos</Text>
        <FotosEvidencia fotos={b.fotos} onCambio={(c) => cambiarBotiquin((q) => ({ ...q, fotos: c(q.fotos) }))} />
      </View>

      <PanelFirma
        titulo="Firma del responsable del botiquín"
        nombre={b.responsable}
        firma={b.firma}
        onFirmando={setFirmando}
        onCambio={(f) => cambiarBotiquin((q) => ({ ...q, firma: f }))}
      />

      <View style={{ flexDirection: "row", gap: 8 }}>
        {ins.botiquines.length > 1 && (
          <Pressable onPress={eliminarBotiquin} style={[est.input, { flex: 1, alignItems: "center" }]}>
            <Text style={[est.texto, { color: color.rojo }]}>Eliminar botiquín</Text>
          </Pressable>
        )}
        <Pressable onPress={i < ins.botiquines.length - 1 ? () => setSel(i + 1) : agregarBotiquin} style={[est.boton, { flex: 2 }]}>
          <Text style={est.botonTexto}>{i < ins.botiquines.length - 1 ? "Siguiente botiquín →" : "+ Agregar otro botiquín"}</Text>
        </Pressable>
      </View>

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

      <BotonesExportar preparar={preparar} />
    </ScrollView>
  );
}
