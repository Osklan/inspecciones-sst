// Verificación en campo del SST-FO-070: un bloque a la vez, C / NC / NA por ítem.
import { Stack, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { Documento } from "@/media/exportar";
import { FotosEvidencia } from "@/ui/FotosEvidencia";
import { OpcionesRespuesta } from "@/ui/OpcionesRespuesta";
import { BotonesExportar } from "@/ui/BotonesExportar";
import { PanelFirma } from "@/ui/PanelFirma";
import { SST_FO_070 } from "@/data/sstFo070";
import { bloquesActivos, calcularResultado, generarPlanAccion, marcarNoAplica } from "@/domain/controlOperacional";
import { tituloInspeccion, type Inspeccion, type InspeccionFrente } from "@/domain/inspeccion";
import type { Criticidad, ItemVerificacion, RespuestaItem } from "@/domain/tipos";
import { guardar, obtener } from "@/db/inspecciones";
import { color, est } from "@/ui/tema";

const COLOR_CRIT: Record<Criticidad, string> = { "Crítico": color.rojo, Mayor: color.ambar, Menor: color.tenue };
const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)} %`);

export default function Verificacion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [ins, setIns] = useState<InspeccionFrente | null>(null);
  const [bloque, setBloque] = useState(0);
  const [firmando, setFirmando] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { obtener(db, id).then((x) => setIns(x?.tipo === "frentes" ? x : null)); }, [db, id]);

  // Guardado automático medio segundo después del último cambio.
  function actualizar(cambio: (x: InspeccionFrente) => InspeccionFrente) {
    setIns((x) => {
      if (!x) return x;
      const n = cambio(x);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => guardar(db, n), 500);
      return n;
    });
  }

  const activos = useMemo(() => (ins ? bloquesActivos(SST_FO_070, ins.actividadesCriticas) : []), [ins]);
  const respuestas = useMemo(() => (ins ? marcarNoAplica(SST_FO_070, activos, ins.respuestas) : {}), [ins, activos]);
  const res = useMemo(() => calcularResultado(SST_FO_070, respuestas), [respuestas]);

  if (!ins) return <View style={est.pantalla} />;
  const b = activos[bloque];
  const plan = generarPlanAccion(SST_FO_070, respuestas, ins.encabezado.fecha);

  function responder(it: ItemVerificacion, r: RespuestaItem) {
    actualizar((x) => ({ ...x, respuestas: { ...x.respuestas, [it.codigo]: { ...x.respuestas[it.codigo], resultado: r } } }));
    if (r === "NC" && it.criticidad === "Crítico") {
      Alert.alert("NC crítica", `${it.codigo}: detenga la tarea asociada hasta su corrección.`);
    }
  }

  async function preparar(doc: Documento): Promise<Inspeccion | null> {
    if (!ins) return null;
    if (res.sinDiligenciar) {
      Alert.alert("Inspección incompleta", `Faltan ${res.sinDiligenciar} ítems por marcar. Complétalos antes de generar el informe.`);
      return null;
    }
    await guardar(db, ins);
    return ins;
  }

  const resBloque = (n: number) => res.bloques.find((x) => x.numero === n)!;

  return (
    <ScrollView style={est.pantalla} contentContainerStyle={est.contenido} keyboardShouldPersistTaps="handled" scrollEnabled={!firmando}>
      <Stack.Screen options={{ title: tituloInspeccion(ins) }} />

      <View style={[est.tarjeta, res.ncPorCriticidad["Crítico"] ? { borderColor: color.rojo, backgroundColor: color.rojoFondo } : null]}>
        <Text style={est.subtitulo}>Resultado</Text>
        <Text style={est.texto}>Cumplimiento: {pct(res.total.cumplimiento)}{res.calificacion ? ` · ${res.calificacion}` : ""}</Text>
        <Text style={est.texto}>NC críticas {res.ncPorCriticidad["Crítico"]} · mayores {res.ncPorCriticidad.Mayor} · menores {res.ncPorCriticidad.Menor}</Text>
        <Text style={[est.texto, { fontWeight: "700" }]}>¿La actividad puede continuar? {res.decision}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {activos.map((x, i) => {
          const r = resBloque(x.numero);
          const pendientes = x.items.length - r.c - r.nc - r.na;
          return (
            <Pressable key={x.prefijo} onPress={() => setBloque(i)} style={[est.input, { paddingVertical: 8 }, i === bloque && { borderColor: color.azul, backgroundColor: color.tinte }]}>
              <Text style={est.texto}>{x.prefijo}{pendientes ? ` (${pendientes})` : " ✓"}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {b && (
        <View style={{ gap: 10 }}>
          <Text style={est.titulo}>{b.numero}. {b.titulo}</Text>
          {b.items.map((it) => {
            const r = ins.respuestas[it.codigo];
            return (
              <View key={it.codigo} style={est.tarjeta}>
                <Text style={[est.etiqueta, { color: COLOR_CRIT[it.criticidad] }]}>{it.codigo} · {it.criticidad}</Text>
                <Text style={est.texto}>{it.criterio}</Text>
                <Text style={est.tenue}>Evidencia: {it.evidencia}</Text>
                <OpcionesRespuesta valor={r?.resultado} onElegir={(o) => responder(it, o)} />
                {r?.resultado === "NC" && (
                  <TextInput
                    style={[est.input, { minHeight: 60 }]}
                    multiline
                    placeholder="Hallazgo: qué se encontró, dónde y quién"
                    value={r.observacion ?? ""}
                    onChangeText={(v) => actualizar((x) => ({ ...x, respuestas: { ...x.respuestas, [it.codigo]: { ...x.respuestas[it.codigo]!, observacion: v } } }))}
                  />
                )}
                {r?.resultado === "NC" && (
                  <FotosEvidencia
                    fotos={r.fotos ?? []}
                    onCambio={(cambio) =>
                      actualizar((x) => {
                        const ry = x.respuestas[it.codigo] ?? { resultado: "NC" as const };
                        return { ...x, respuestas: { ...x.respuestas, [it.codigo]: { ...ry, fotos: cambio(ry.fotos ?? []) } } };
                      })
                    }
                  />
                )}
              </View>
            );
          })}
          {bloque < activos.length - 1 && (
            <Pressable style={est.boton} onPress={() => setBloque(bloque + 1)}>
              <Text style={est.botonTexto}>Siguiente bloque →</Text>
            </Pressable>
          )}
        </View>
      )}

      {plan.length > 0 && (
        <View style={est.tarjeta}>
          <Text style={est.subtitulo}>Plan de acción ({plan.length})</Text>
          {plan.map((p) => (
            <Text key={p.codigo} style={est.texto}>
              <Text style={{ fontWeight: "700", color: COLOR_CRIT[p.criticidad] }}>{p.codigo}</Text> · límite {p.fechaLimite}{p.hallazgo ? ` · ${p.hallazgo}` : ""}
            </Text>
          ))}
        </View>
      )}

      <View style={est.tarjeta}>
        <Text style={est.subtitulo}>Fotos de la visita</Text>
        <Text style={est.tenue}>Evidencia de control operacional, haya o no hallazgos. Sale al final del anexo fotográfico del informe.</Text>
        <FotosEvidencia fotos={ins.fotosVisita ?? []} onCambio={(c) => actualizar((x) => ({ ...x, fotosVisita: c(x.fotosVisita ?? []) }))} />
      </View>

      <View style={est.tarjeta}>
        <Text style={est.subtitulo}>Acciones tomadas en sitio</Text>
        <TextInput style={[est.input, { minHeight: 80 }]} multiline value={ins.accionesEnSitio} onChangeText={(v) => actualizar((x) => ({ ...x, accionesEnSitio: v }))} />
      </View>

      <PanelFirma
        titulo="Firma Profesional SST OINAC"
        nombre={ins.encabezado.verificadoPor}
        firma={ins.firmas?.oinac}
        onFirmando={setFirmando}
        onCambio={(f) => actualizar((x) => ({ ...x, firmas: { ...x.firmas, oinac: f } }))}
      />
      <PanelFirma
        titulo="Firma Profesional SST contratista"
        nombre={ins.encabezado.responsableContratista}
        firma={ins.firmas?.contratista}
        onFirmando={setFirmando}
        onCambio={(f) => actualizar((x) => ({ ...x, firmas: { ...x.firmas, contratista: f } }))}
      />

      <BotonesExportar preparar={preparar} />
    </ScrollView>
  );
}
