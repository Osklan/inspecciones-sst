// Botones C / NC / NA de un ítem de verificación.
import { Pressable, Text, View } from "react-native";
import type { RespuestaItem } from "@/domain/tipos";
import { color, est } from "./tema";

const OPCIONES: RespuestaItem[] = ["C", "NC", "NA"];
const fondo = (r: RespuestaItem) => (r === "C" ? color.verdeFondo : r === "NC" ? color.rojoFondo : color.tinte);
const tinta = (r: RespuestaItem) => (r === "C" ? color.verde : r === "NC" ? color.rojo : color.tinta);

export function OpcionesRespuesta({ valor, onElegir }: { valor?: RespuestaItem; onElegir: (r: RespuestaItem) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {OPCIONES.map((o) => {
        const sel = valor === o;
        return (
          <Pressable key={o} onPress={() => onElegir(o)} style={[est.input, { flex: 1, alignItems: "center" }, sel && { backgroundColor: fondo(o), borderColor: tinta(o) }]}>
            <Text style={[est.texto, { fontWeight: "700", color: sel ? tinta(o) : color.tinta }]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
