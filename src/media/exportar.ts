// Genera el PDF del informe y abre el menú de compartir (WhatsApp, correo, Drive…).
import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { informeFrenteHtml, nombreArchivoInforme } from "@/domain/informeFrente";
import { informeLocativaHtml, nombreArchivoLocativa } from "@/domain/informeLocativa";
import type { Inspeccion } from "@/domain/inspeccion";
import { fotosEnBase64 } from "./fotos";

export async function exportarPdf(ins: Inspeccion): Promise<string> {
  let html: string, nombre: string;
  if (ins.tipo === "locativas") {
    html = informeLocativaHtml(ins, await fotosEnBase64(ins.puntos.flatMap((p) => p.fotos)));
    nombre = nombreArchivoLocativa(ins);
  } else {
    html = informeFrenteHtml(ins, await fotosEnBase64(Object.values(ins.respuestas).flatMap((r) => r?.fotos ?? [])));
    nombre = nombreArchivoInforme(ins);
  }
  const { uri } = await Print.printToFileAsync({ html });
  const destino = new File(Paths.cache, nombre);
  if (destino.exists) destino.delete();
  await new File(uri).move(destino);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(destino.uri, { mimeType: "application/pdf", dialogTitle: "Compartir informe" });
  }
  return destino.uri;
}
