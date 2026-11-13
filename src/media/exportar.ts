// Genera el PDF del informe o de la lista de verificación y abre el menú de compartir (WhatsApp, correo, Drive…).
import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { Inspeccion } from "@/domain/inspeccion";
import { htmlDocumento, nombreArchivo, type Documento } from "./documentos";

export type { Documento };

/** Solo en la web: pestaña donde se abrirá el documento, abierta al tocar el botón. */
export type Destino = undefined;
export const abrirDestino = (): Destino => undefined;
export const cerrarDestino = (_d: Destino): void => {};

export async function exportarPdf(ins: Inspeccion, doc: Documento = "informe", _destino?: Destino): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html: await htmlDocumento(ins, doc) });
  const destino = new File(Paths.cache, nombreArchivo(ins, doc));
  if (destino.exists) destino.delete();
  await new File(uri).move(destino);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(destino.uri, {
      mimeType: "application/pdf",
      dialogTitle: doc === "checklist" ? "Compartir lista de verificación" : "Compartir informe",
    });
  }
  return destino.uri;
}
