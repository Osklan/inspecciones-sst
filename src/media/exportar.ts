// Genera el PDF del informe y abre el menú de compartir (WhatsApp, correo, Drive…).
import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { informeFrenteHtml, nombreArchivoInforme } from "@/domain/informeFrente";
import type { InspeccionFrente } from "@/domain/inspeccion";
import { fotosEnBase64 } from "./fotos";

export async function exportarPdf(ins: InspeccionFrente): Promise<string> {
  const uris = Object.values(ins.respuestas).flatMap((r) => r?.fotos ?? []);
  const html = informeFrenteHtml(ins, await fotosEnBase64(uris));
  const { uri } = await Print.printToFileAsync({ html });
  const destino = new File(Paths.cache, nombreArchivoInforme(ins));
  if (destino.exists) destino.delete();
  await new File(uri).move(destino);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(destino.uri, { mimeType: "application/pdf", dialogTitle: "Compartir informe" });
  }
  return destino.uri;
}
