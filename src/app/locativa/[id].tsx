// Inspección de condiciones locativas: un punto a la vez (frente, sede), C / NC / NA por aspecto.
import { Stack, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { Documento } from "@/media/exportar";
import { borrarFoto } from "@/media/fotos";
import { tituloInspeccion, type Inspeccion } from "@/domain/inspeccion";
import { calcularLocativa, firmasDePunto, grupoEn, listaDe, numeroEn, nuevoPunto, type InspeccionLocativa, type PuntoLocativo } from "@/domain/locativas";
import type { RespuestaItem } from "@/domain/tipos";
import { guardar, obtener } from "@/db/inspecciones";
import { FotosEvidencia } from "@/ui/FotosEvidencia";
import { OpcionesRespuesta } from "@/ui/OpcionesRespuesta";
import { BotonesExportar } from "@/ui/BotonesExportar";
import { PanelFirma } from "@/ui/PanelFirma";
import { color, est } from "@/ui/tema";

const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)} %`);

const TEXTOS_INFORME: [keyof Pick<InspeccionLocativa, "objetivo" | "resultados" | "conclusiones" | "recomendaciones">, string, string][] = [
  ["objetivo", "Objetivo", ""],
  ["resultados", "Resultados (texto)", "Resumen de lo encontrado. Las tablas de cumplimiento se agregan solas."],
  ["conclusiones", "Conclusiones", "Una por línea."],
  ["recomendaciones", "Recomendaciones", "Una por línea."],
];

export default function InspeccionLocativaPantalla() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [ins, setIns] = useState<InspeccionLocativa | null>(null);
  const [sel, setSel] = useState(0);
  const [firmando, setFirmando] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { obtener(db, id).then((x) => setIns(x?.tipo === "locativas" ? x : null)); }, [db, id]);

  // Guardado automático medio segundo después del último cambio.
  function actualizar(cambio: (x: InspeccionLocativa) => InspeccionLocativa) {
    setIns((x) => {
      if (!x) return x;
      const n = cambio(x);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => guardar(db, n), 500);
      return n;
    });
  }

  const res = useMemo(() => (ins ? calcularLocativa(ins) : null), [ins]);
  if (!ins || !res) return <View style={est.pantalla} />;
  const lista = listaDe(ins);
  const i = Math.min(sel, ins.puntos.length - 1);
  const p = ins.puntos[i];
  const rp = res.puntos[i];

  const cambiarPunto = (cambio: (p: PuntoLocativo) => PuntoLocativo) =>
    actualizar((x) => ({ ...x, puntos: x.puntos.map((q) => (q.id === p.id ? cambio(q) : q)) }));
  const responder = (k: number, r: RespuestaItem) => cambiarPunto((q) => ({ ...q, respuestas: { ...q.respuestas, [k]: r } }));
  const todoCumple = () =>
    cambiarPunto((q) => ({ ...q, respuestas: Object.fromEntries(lista.aspectos.map((_, k) => [k, q.respuestas[k] ?? "C"])) }));

  function agregarPunto() {
    actualizar((x) => ({ ...x, puntos: [...x.puntos, nuevoPunto(`${x.id}-${Date.now().toString(36)}`)] }));
    setSel(ins!.puntos.length);
  }

  function eliminarPunto() {
    Alert.alert("Eliminar punto", `¿Eliminar «${p.nombre || `Punto ${i + 1}`}» y sus fotos?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar", style: "destructive", onPress: () => {
          p.fotos.forEach(borrarFoto);
          actualizar((x) => ({ ...x, puntos: x.puntos.filter((q) => q.id !== p.id) }));
          setSel(Math.max(0, i - 1));
        },
      },
    ]);
  }

  async function preparar(doc: Documento): Promise<Inspeccion | null> {
    if (!ins) return null;
    const sinNombre = ins.puntos.findIndex((q) => !q.nombre.trim());
    if (sinNombre >= 0) {
      setSel(sinNombre);
      Alert.alert("Falta el nombre", "Escribe el nombre de cada punto inspeccionado antes de generar el informe.");
      return null;
    }
    if (res!.total.sinMarcar) {
      Alert.alert("Inspección incompleta", `Faltan ${res!.total.sinMarcar} aspectos por marcar. Complétalos antes de generar el informe.`);
      return null;
    }
    await guardar(db, ins);
    return ins;
  }

  return (
    <ScrollView style={est.pantalla} contentContainerStyle={est.contenido} keyboardShouldPersistTaps="handled" scrollEnabled={!firmando}>
      <Stack.Screen options={{ title: tituloInspeccion(ins) }} />

      <View style={[est.tarjeta, res.conHallazgo.length ? { borderColor: color.ambar, backgroundColor: color.ambarFondo } : null]}>
        <Text style={est.subtitulo}>Resultado</Text>
        <Text style={est.texto}>Cumplimiento: {pct(res.total.cumplimiento)}{res.calificacion ? ` · ${res.calificacion}` : ""}</Text>
        <Text style={est.texto}>{res.resumen}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {ins.puntos.map((q, k) => {
          const r = res.puntos[k];
          return (
            <Pressable key={q.id} onPress={() => setSel(k)} style={[est.input, { paddingVertical: 8, maxWidth: 180 }, k === i && { borderColor: color.azul, backgroundColor: color.tinte }]}>
              <Text style={est.texto} numberOfLines={1}>
                {q.nombre || `Punto ${k + 1}`}{r.sinMarcar ? ` (${r.sinMarcar})` : r.nc ? ` · ${r.nc} NC` : " ✓"}
              </Text>
            </Pressable>
          );
        })}
        <Pressable onPress={agregarPunto} style={[est.input, { paddingVertical: 8 }]}>
          <Text style={[est.texto, { color: color.azul, fontWeight: "700" }]}>+ Punto</Text>
        </Pressable>
      </ScrollView>

      <View style={est.tarjeta}>
        <Text style={est.etiqueta}>Punto inspeccionado {i + 1} de {ins.puntos.length}</Text>
        <TextInput
          style={est.input}
          placeholder={lista.firmasPunto ? "Nombre de la concesión" : "Ej.: Contratista LEGGO – antiguo parqueadero nacional"}
          value={p.nombre}
          onChangeText={(v) => cambiarPunto((q) => ({ ...q, nombre: v }))}
        />
        {lista.camposPunto?.map((c) => {
          const valor = p.campos?.[c.id] ?? "";
          const poner = (v: string) => cambiarPunto((q) => ({ ...q, campos: { ...q.campos, [c.id]: v } }));
          if (!c.opciones) return (
            <View key={c.id} style={{ gap: 4 }}>
              <Text style={est.etiqueta}>{c.etiqueta}</Text>
              <TextInput style={est.input} value={valor} onChangeText={poner} />
            </View>
          );
          const marcados = valor.split(",").map((x) => x.trim()).filter(Boolean);
          const alternar = (o: string) => poner((marcados.includes(o) ? marcados.filter((x) => x !== o) : [...marcados, o]).join(", "));
          return (
            <View key={c.id} style={{ gap: 4 }}>
              <Text style={est.etiqueta}>{c.etiqueta}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {c.opciones.map((o) => (
                  <Pressable key={o} onPress={() => alternar(o)} style={[est.input, { paddingVertical: 6 }, marcados.includes(o) && { borderColor: color.azul, backgroundColor: color.tinte }]}>
                    <Text style={est.texto}>{marcados.includes(o) ? "☑ " : "☐ "}{o}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
        {rp.sinMarcar > 0 && (
          <Pressable onPress={todoCumple} style={[est.input, { alignItems: "center" }]}>
            <Text style={est.texto}>Marcar como C los {rp.sinMarcar} aspectos sin marcar</Text>
          </Pressable>
        )}
      </View>

      {lista.aspectos.map((a, k) => (
        <View key={k} style={{ gap: 8 }}>
          {grupoEn(lista, k) && <Text style={[est.subtitulo, { marginTop: 4 }]}>{grupoEn(lista, k)}</Text>}
          <View style={est.tarjeta}>
            <Text style={est.texto}>{lista.numeros ? `${numeroEn(lista, k)}. ` : ""}{a}</Text>
            <OpcionesRespuesta valor={p.respuestas[k]} onElegir={(o) => responder(k, o)} />
            {p.respuestas[k] === "NC" && (
              <TextInput
                style={est.input}
                placeholder="Observación (sale en la lista de verificación)"
                value={p.observaciones?.[k] ?? ""}
                onChangeText={(v) => cambiarPunto((q) => ({ ...q, observaciones: { ...q.observaciones, [k]: v } }))}
              />
            )}
          </View>
        </View>
      ))}

      {rp.nc > 0 && (
        <View style={[est.tarjeta, { borderColor: color.rojo }]}>
          <Text style={est.subtitulo}>Hallazgo</Text>
          <Text style={est.etiqueta}>Qué se encontró</Text>
          <TextInput
            style={[est.input, { minHeight: 80 }]}
            multiline
            placeholder="Si lo dejas vacío, el informe lista los aspectos que no cumplen."
            value={p.hallazgo}
            onChangeText={(v) => cambiarPunto((q) => ({ ...q, hallazgo: v }))}
          />
          <Text style={est.etiqueta}>Riesgo asociado</Text>
          <TextInput style={[est.input, { minHeight: 60 }]} multiline value={p.riesgo} onChangeText={(v) => cambiarPunto((q) => ({ ...q, riesgo: v }))} />
          <Text style={est.etiqueta}>Acción recomendada</Text>
          <TextInput style={[est.input, { minHeight: 60 }]} multiline value={p.accion} onChangeText={(v) => cambiarPunto((q) => ({ ...q, accion: v }))} />
          <Text style={est.etiqueta}>Evidencia fotográfica</Text>
          <FotosEvidencia fotos={p.fotos} onCambio={(cambio) => cambiarPunto((q) => ({ ...q, fotos: cambio(q.fotos) }))} />
        </View>
      )}

      {firmasDePunto(lista, p).map((f) => (
        <PanelFirma
          key={f.id}
          titulo={`${f.rol} – ${p.nombre || `Punto ${i + 1}`}${f.id === "inspector" ? " (si no firmas aquí, se usa la firma de quien inspecciona)" : ""}`}
          nombre={f.nombre || (f.id === "inspector" ? ins.encabezado.elaboradoPor : "")}
          firma={f.firma}
          onFirmando={setFirmando}
          onCambio={(x) => cambiarPunto((q) => ({ ...q, firmas: { ...q.firmas, [f.id]: x } }))}
        />
      ))}

      <View style={{ flexDirection: "row", gap: 8 }}>
        {ins.puntos.length > 1 && (
          <Pressable onPress={eliminarPunto} style={[est.input, { flex: 1, alignItems: "center" }]}>
            <Text style={[est.texto, { color: color.rojo }]}>Eliminar punto</Text>
          </Pressable>
        )}
        <Pressable onPress={i < ins.puntos.length - 1 ? () => setSel(i + 1) : agregarPunto} style={[est.boton, { flex: 2 }]}>
          <Text style={est.botonTexto}>{i < ins.puntos.length - 1 ? "Siguiente punto →" : "+ Agregar otro punto"}</Text>
        </Pressable>
      </View>

      <View style={est.tarjeta}>
        <Text style={est.subtitulo}>Textos del informe</Text>
        {TEXTOS_INFORME.map(([k, label, ayuda]) => (
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

      {!lista.firmasPunto && (
        <PanelFirma
          titulo="Responsable del área"
          nombre={ins.encabezado.responsableArea}
          firma={ins.firmas?.responsable}
          onFirmando={setFirmando}
          onCambio={(f) => actualizar((x) => ({ ...x, firmas: { ...x.firmas, responsable: f } }))}
        />
      )}

      <BotonesExportar preparar={preparar} />
    </ScrollView>
  );
}
