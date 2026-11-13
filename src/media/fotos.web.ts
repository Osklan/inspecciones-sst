// En el navegador las fotos se reducen a 1600 px y se guardan dentro de la inspección como data URI.
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

const ANCHO_MAX = 1600;
const PREFIJO = "data:image/jpeg;base64,";

export async function tomarFoto(origen: "camara" | "galeria"): Promise<string | null> {
  const opciones: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 1 };
  const r = origen === "camara" ? await ImagePicker.launchCameraAsync(opciones) : await ImagePicker.launchImageLibraryAsync(opciones);
  if (r.canceled || !r.assets?.length) return null;
  const a = r.assets[0];
  const ctx = ImageManipulator.manipulate(a.uri);
  if (a.width > ANCHO_MAX) ctx.resize({ width: ANCHO_MAX });
  const img = await ctx.renderAsync();
  const res = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  return res.base64 ? PREFIJO + res.base64.replace(/^data:image\/\w+;base64,/, "") : res.uri;
}

/** Las fotos viven dentro de la inspección: al quitarlas de la lista ya no queda nada que borrar. */
export function borrarFoto(_uri: string): void {}

export async function fotosEnBase64(uris: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const uri of uris) {
    const m = /^data:image\/\w+;base64,(.*)$/.exec(uri);
    if (m) out[uri] = m[1];
  }
  return out;
}
