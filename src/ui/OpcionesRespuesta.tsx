// Botones C / NC / NA de un ítem de verificación.
import { Pressable, Text, View } from "react-native";
import type { RespuestaItem } from "@/domain/tipos";
import { color, est } from "./tema";

const OPCIONES: RespuestaItem[] = ["C", "NC", "NA"];
const fondo = (r: RespuestaItem) => (r === "C" ? color.verdeFondo : r === "NC" ? color.rojoFondo : color.tinte);
const tinta = (r: RespuestaItem) => (r === "C" ? color.verde : r === "NC" ? color.rojo : color.tinta);

/**
 * @param bueno En las fichas SI/NO: la respuesta que indica buen estado. Los botones dicen SI / NO / NA
 * y se guardan como C (buen estado) o NC.
 */
export function OpcionesRespuesta({ valor, onElegir, bueno }: { valor?: RespuestaItem; onElegir: (r: RespuestaItem) => void; bueno?: "SI" | "NO" }) {
  const opciones: [RespuestaItem, string][] = bueno
    ? [[bueno === "SI" ? "C" : "NC", "SI"], [bueno === "SI" ? "NC" : "C", "NO"], ["NA", "NA"]]
    : OPCIONES.map((o) => [o, o]);
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {opciones.map(([o, etiqueta]) => {
        const sel = valor === o;
        return (
          <Pressable key={o} onPress={() => onElegir(o)} style={[est.input, { flex: 1, alignItems: "center" }, sel && { backgroundColor: fondo(o), borderColor: tinta(o) }]}>
            <Text style={[est.texto, { fontWeight: "700", color: sel ? tinta(o) : color.tinta }]}>{etiqueta}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
