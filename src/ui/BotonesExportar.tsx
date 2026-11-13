// Botones para generar y compartir el informe y la lista de verificación en PDF.
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Alert } from "@/ui/alerta";
import type { Inspeccion } from "@/domain/inspeccion";
import { abrirDestino, cerrarDestino, exportarPdf, type Documento } from "@/media/exportar";
import { color, est } from "./tema";

interface Props {
  /** Guarda la inspección y la devuelve; null si no está lista para exportar (ya avisó por qué). */
  preparar: (doc: Documento) => Promise<Inspeccion | null>;
}

export function BotonesExportar({ preparar }: Props) {
  const [ocupado, setOcupado] = useState<Documento | null>(null);

  async function exportar(doc: Documento) {
    // En la web la pestaña del documento se abre ya, mientras el toque cuenta como gesto del usuario.
    const destino = abrirDestino();
    setOcupado(doc);
    try {
      const ins = await preparar(doc);
      if (ins) await exportarPdf(ins, doc, destino);
      else cerrarDestino(destino);
    } catch (e) {
      cerrarDestino(destino);
      Alert.alert("No se pudo generar el PDF", String((e as Error).message ?? e));
    } finally {
      setOcupado(null);
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <Pressable style={[est.boton, ocupado && { opacity: 0.6 }]} disabled={!!ocupado} onPress={() => exportar("informe")}>
        <Text style={est.botonTexto}>{ocupado === "informe" ? "Generando PDF…" : "Informe PDF y compartir"}</Text>
      </Pressable>
      <Pressable style={[est.boton, { backgroundColor: color.azul2 }, ocupado && { opacity: 0.6 }]} disabled={!!ocupado} onPress={() => exportar("checklist")}>
        <Text style={est.botonTexto}>{ocupado === "checklist" ? "Generando PDF…" : "Lista de verificación PDF y compartir"}</Text>
      </Pressable>
    </View>
  );
}
