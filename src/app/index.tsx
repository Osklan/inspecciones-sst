// Lista de inspecciones guardadas en el teléfono.
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Alert, FlatList, Image, Pressable, Text, View } from "react-native";
import { SST_FO_070 } from "@/data/sstFo070";
import { bloquesActivos, calcularResultado, marcarNoAplica } from "@/domain/controlOperacional";
import { ETIQUETA_TIPO, fotosDe, tituloInspeccion, type Inspeccion } from "@/domain/inspeccion";
import { calcularBotiquines } from "@/domain/botiquines";
import { calcularEquipos } from "@/domain/equipos";
import { calcularLocativa } from "@/domain/locativas";
import { eliminar, listar } from "@/db/inspecciones";
import { borrarFoto } from "@/media/fotos";
import { rutaInspeccion } from "@/ui/rutas";
import { color, est } from "@/ui/tema";

function resumen(i: Inspeccion): { cumplimiento: number | null; pendientes: number; alerta: string | null } {
  if (i.tipo === "equipos") {
    const r = calcularEquipos(i);
    const aptos = r.total - r.sinResultado;
    return { cumplimiento: aptos ? r.porResultado.Apto / aptos : null, pendientes: r.sinResultado, alerta: r.hallazgos.length ? r.resumen : null };
  }
  if (i.tipo === "botiquines") {
    const r = calcularBotiquines(i);
    return { cumplimiento: r.cumplimiento, pendientes: r.sinDiligenciar, alerta: r.conHallazgo.length ? r.resumen : null };
  }
  if (i.tipo === "locativas") {
    const r = calcularLocativa(i);
    return { cumplimiento: r.total.cumplimiento, pendientes: r.total.sinMarcar, alerta: r.conHallazgo.length ? r.resumen : null };
  }
  const activos = bloquesActivos(SST_FO_070, i.actividadesCriticas);
  const r = calcularResultado(SST_FO_070, marcarNoAplica(SST_FO_070, activos, i.respuestas));
  const crit = r.ncPorCriticidad["Crítico"];
  return { cumplimiento: r.total.cumplimiento, pendientes: r.sinDiligenciar, alerta: crit ? `${crit} NC crítica(s): tarea detenida` : null };
}


export default function Lista() {
  const db = useSQLiteContext();
  const [items, setItems] = useState<Inspeccion[]>([]);

  useFocusEffect(useCallback(() => { listar(db).then(setItems); }, [db]));

  function borrar(i: Inspeccion) {
    Alert.alert("Borrar inspección", `¿Borrar «${tituloInspeccion(i)}» del ${i.encabezado.fecha.split("-").reverse().join("/")} con sus fotos y firmas? No se puede deshacer.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar", style: "destructive", onPress: async () => {
          await eliminar(db, i.id);
          fotosDe(i).forEach(borrarFoto);
          setItems((x) => x.filter((y) => y.id !== i.id));
        },
      },
    ]);
  }

  return (
    <View style={est.pantalla}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={est.contenido}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <Image source={require("../../assets/logo-sst-track.png")} style={{ width: 140, height: 140, alignSelf: "center", borderRadius: 24 }} />
            <Pressable style={est.boton} onPress={() => router.push("/nueva")}>
              <Text style={est.botonTexto}>+ Nueva inspección</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={items.length ? <Text style={[est.tenue, { textAlign: "center" }]}>Mantén presionada una inspección para borrarla.</Text> : undefined}
        ListEmptyComponent={<Text style={[est.tenue, { textAlign: "center", marginTop: 24 }]}>Aún no hay inspecciones en este teléfono.</Text>}
        renderItem={({ item }) => {
          const r = resumen(item);
          const pct = r.cumplimiento === null ? "—" : `${Math.round(r.cumplimiento * 100)} %`;
          return (
            <Pressable style={est.tarjeta} onPress={() => router.push(rutaInspeccion(item))} onLongPress={() => borrar(item)}>
              <Text style={est.tenue}>{ETIQUETA_TIPO[item.tipo]} · {item.encabezado.fecha}</Text>
              <Text style={est.titulo}>{tituloInspeccion(item)}</Text>
              <Text style={est.texto}>
                Cumplimiento {pct}
                {r.pendientes ? ` · faltan ${r.pendientes} ítems` : ""}
              </Text>
              {r.alerta && <Text style={{ color: color.rojo, fontWeight: "700" }}>{r.alerta}</Text>}
            </Pressable>
          );
        }}
      />
    </View>
  );
}
