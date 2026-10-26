// Genera el PDF del informe o de la lista de verificación y abre el menú de compartir (WhatsApp, correo, Drive…).
import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { checklistEquiposHtml, checklistFrenteHtml, checklistLocativaHtml, nombreArchivoChecklist } from "@/domain/checklists";
import { checklistBotiquinesHtml, informeBotiquinesHtml, nombreArchivoBotiquines } from "@/domain/informeBotiquines";
import { informeFrenteHtml, nombreArchivoInforme } from "@/domain/informeFrente";
import { informeEquiposHtml, nombreArchivoEquipos } from "@/domain/informeEquipos";
import { informeLocativaHtml, nombreArchivoLocativa } from "@/domain/informeLocativa";
import { fotosDe, type Inspeccion } from "@/domain/inspeccion";
import { fotosEnBase64 } from "./fotos";

export type Documento = "informe" | "checklist";

function nombreArchivo(ins: Inspeccion): string {
  switch (ins.tipo) {
    case "botiquines": return nombreArchivoBotiquines(ins);
    case "equipos": return nombreArchivoEquipos(ins);
    case "locativas": return nombreArchivoLocativa(ins);
    case "frentes": return nombreArchivoInforme(ins);
  }
}

async function html(ins: Inspeccion, doc: Documento): Promise<string> {
  if (doc === "checklist") {
    switch (ins.tipo) {
      case "botiquines": return checklistBotiquinesHtml(ins);
      case "equipos": return checklistEquiposHtml(ins);
      case "locativas": return checklistLocativaHtml(ins);
      case "frentes": return checklistFrenteHtml(ins);
    }
  }
  const fotos = await fotosEnBase64(fotosDe(ins));
  switch (ins.tipo) {
    case "botiquines": return informeBotiquinesHtml(ins, fotos);
    case "equipos": return informeEquiposHtml(ins, fotos);
    case "locativas": return informeLocativaHtml(ins, fotos);
    case "frentes": return informeFrenteHtml(ins, fotos);
  }
}

export async function exportarPdf(ins: Inspeccion, doc: Documento = "informe"): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html: await html(ins, doc) });
  const nombre = doc === "checklist" ? nombreArchivoChecklist(nombreArchivo(ins)) : nombreArchivo(ins);
  const destino = new File(Paths.cache, nombre);
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
