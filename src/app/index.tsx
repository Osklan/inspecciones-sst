// Lista de inspecciones guardadas en el teléfono.
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SST_FO_070 } from "@/data/sstFo070";
import { bloquesActivos, calcularResultado, marcarNoAplica } from "@/domain/controlOperacional";
import { ETIQUETA_TIPO, tituloInspeccion, type Inspeccion } from "@/domain/inspeccion";
import { calcularEquipos } from "@/domain/equipos";
import { calcularLocativa } from "@/domain/locativas";
import { listar } from "@/db/inspecciones";
import { rutaInspeccion } from "@/ui/rutas";
import { color, est } from "@/ui/tema";

function resumen(i: Inspeccion): { cumplimiento: number | null; pendientes: number; alerta: string | null } {
  if (i.tipo === "equipos") {
    const r = calcularEquipos(i);
    const aptos = r.total - r.sinResultado;
    return { cumplimiento: aptos ? r.porResultado.Apto / aptos : null, pendientes: r.sinResultado, alerta: r.hallazgos.length ? r.resumen : null };
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

  return (
    <View style={est.pantalla}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={est.contenido}
        ListHeaderComponent={
          <Pressable style={est.boton} onPress={() => router.push("/nueva")}>
            <Text style={est.botonTexto}>+ Nueva inspección</Text>
          </Pressable>
        }
        ListEmptyComponent={<Text style={[est.tenue, { textAlign: "center", marginTop: 24 }]}>Aún no hay inspecciones en este teléfono.</Text>}
        renderItem={({ item }) => {
          const r = resumen(item);
          const pct = r.cumplimiento === null ? "—" : `${Math.round(r.cumplimiento * 100)} %`;
          return (
            <Pressable style={est.tarjeta} onPress={() => router.push(rutaInspeccion(item))}>
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
