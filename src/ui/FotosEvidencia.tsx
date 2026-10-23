// Fotos de evidencia de un hallazgo: miniaturas, botones de cámara y galería.
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { borrarFoto, tomarFoto } from "@/media/fotos";
import { est } from "./tema";

interface Props {
  fotos: string[];
  onCambio: (cambio: (fotos: string[]) => string[]) => void;
}

export function FotosEvidencia({ fotos, onCambio }: Props) {
  async function agregar(origen: "camara" | "galeria") {
    try {
      const uri = await tomarFoto(origen);
      if (uri) onCambio((f) => [...f, uri]);
    } catch (e) {
      Alert.alert("No se pudo agregar la foto", String((e as Error).message ?? e));
    }
  }

  function quitar(uri: string) {
    Alert.alert("Eliminar foto", "¿Quitar esta foto de la evidencia?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar", style: "destructive", onPress: () => {
          onCambio((f) => f.filter((x) => x !== uri));
          borrarFoto(uri);
        },
      },
    ]);
  }

  return (
    <View style={{ gap: 8 }}>
      {!!fotos.length && (
        <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>
          {fotos.map((f) => (
            <Pressable key={f} onLongPress={() => quitar(f)}>
              <Image source={{ uri: f }} style={{ width: 96, height: 72, borderRadius: 6 }} />
            </Pressable>
          ))}
        </ScrollView>
      )}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable style={[est.input, { flex: 1, alignItems: "center" }]} onPress={() => agregar("camara")}>
          <Text style={est.texto}>📷 Tomar foto</Text>
        </Pressable>
        <Pressable style={[est.input, { flex: 1, alignItems: "center" }]} onPress={() => agregar("galeria")}>
          <Text style={est.texto}>Galería</Text>
        </Pressable>
      </View>
      {!!fotos.length && <Text style={est.tenue}>Mantén presionada una foto para quitarla.</Text>}
    </View>
  );
}
