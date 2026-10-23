// Lista de inspecciones guardadas en el teléfono.
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SST_FO_070 } from "@/data/sstFo070";
import { bloquesActivos, calcularResultado, marcarNoAplica } from "@/domain/controlOperacional";
import { ETIQUETA_TIPO, tituloInspeccion, type Inspeccion } from "@/domain/inspeccion";
import { listar } from "@/db/inspecciones";
import { color, est } from "@/ui/tema";

function resumen(i: Inspeccion) {
  const activos = bloquesActivos(SST_FO_070, i.actividadesCriticas);
  return calcularResultado(SST_FO_070, marcarNoAplica(SST_FO_070, activos, i.respuestas));
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
          const pct = r.total.cumplimiento === null ? "—" : `${Math.round(r.total.cumplimiento * 100)} %`;
          const critica = r.ncPorCriticidad["Crítico"] > 0;
          return (
            <Pressable style={est.tarjeta} onPress={() => router.push({ pathname: "/inspeccion/[id]", params: { id: item.id } })}>
              <Text style={est.tenue}>{ETIQUETA_TIPO[item.tipo]} · {item.encabezado.fecha}</Text>
              <Text style={est.titulo}>{tituloInspeccion(item)}</Text>
              <Text style={est.texto}>
                Cumplimiento {pct}
                {r.sinDiligenciar ? ` · faltan ${r.sinDiligenciar} ítems` : ""}
              </Text>
              {critica && <Text style={{ color: color.rojo, fontWeight: "700" }}>{r.ncPorCriticidad["Crítico"]} NC crítica(s): tarea detenida</Text>}
            </Pressable>
          );
        }}
      />
    </View>
  );
}
