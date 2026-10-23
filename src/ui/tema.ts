// Colores y estilos base, tomados del formato de informes de OINAC.
import { StyleSheet } from "react-native";

export const color = {
  azul: "#1F3864",
  azul2: "#153D63",
  tinte: "#D9E2F3",
  fondo: "#EEF1F6",
  superficie: "#FFFFFF",
  tinta: "#18202E",
  tenue: "#5B6578",
  linea: "#D3D9E4",
  rojo: "#B42318",
  rojoFondo: "#FDECEA",
  ambar: "#9A6700",
  ambarFondo: "#FFF4D6",
  verde: "#1E7B45",
  verdeFondo: "#E3F4EA",
};

export const est = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.fondo },
  contenido: { padding: 16, gap: 12, paddingBottom: 48 },
  tarjeta: { backgroundColor: color.superficie, borderColor: color.linea, borderWidth: 1, borderRadius: 10, padding: 14, gap: 10 },
  titulo: { fontSize: 18, fontWeight: "700", color: color.tinta },
  subtitulo: { fontSize: 15, fontWeight: "700", color: color.azul },
  texto: { fontSize: 15, color: color.tinta },
  tenue: { fontSize: 13, color: color.tenue },
  etiqueta: { fontSize: 13, fontWeight: "600", color: color.tenue },
  input: { borderColor: color.linea, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: color.tinta, backgroundColor: "#F6F8FB" },
  boton: { backgroundColor: color.azul, borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  botonTexto: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
