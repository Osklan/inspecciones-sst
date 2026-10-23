// Fotos de evidencia: se toman con la cámara, se reducen a 1600 px y se guardan en la app.
import { Directory, File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

const ANCHO_MAX = 1600;

function carpetaFotos(): Directory {
  const dir = new Directory(Paths.document, "fotos");
  dir.create({ idempotent: true, intermediates: true });
  return dir;
}

async function reducirYGuardar(uri: string, ancho: number): Promise<string> {
  const ctx = ImageManipulator.manipulate(uri);
  if (ancho > ANCHO_MAX) ctx.resize({ width: ANCHO_MAX });
  const img = await ctx.renderAsync();
  const res = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.7 });
  const destino = new File(carpetaFotos(), `${Date.now().toString(36)}.jpg`);
  await new File(res.uri).copy(destino);
  return destino.uri;
}

/** Abre la cámara (o la galería) y devuelve la URI de la foto guardada, o null si se cancela. */
export async function tomarFoto(origen: "camara" | "galeria"): Promise<string | null> {
  if (origen === "camara") {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) throw new Error("Sin permiso para usar la cámara.");
  }
  const opciones: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 1 };
  const r = origen === "camara" ? await ImagePicker.launchCameraAsync(opciones) : await ImagePicker.launchImageLibraryAsync(opciones);
  if (r.canceled || !r.assets?.length) return null;
  const a = r.assets[0];
  return reducirYGuardar(a.uri, a.width);
}

export function borrarFoto(uri: string): void {
  const f = new File(uri);
  if (f.exists) f.delete();
}

/** Lee varias fotos como base64; las que ya no existen se omiten. */
export async function fotosEnBase64(uris: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const uri of uris) {
    const f = new File(uri);
    if (f.exists) out[uri] = await f.base64();
  }
  return out;
}
