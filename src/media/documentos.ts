// HTML y nombre de archivo del informe o de la lista de verificación de cada tipo de inspección.
import { checklistEquiposHtml, checklistFrenteHtml, checklistLocativaHtml, nombreArchivoChecklist } from "@/domain/checklists";
import { checklistBotiquinesHtml, informeBotiquinesHtml, nombreArchivoBotiquines } from "@/domain/informeBotiquines";
import { informeFrenteHtml, nombreArchivoInforme } from "@/domain/informeFrente";
import { informeEquiposHtml, nombreArchivoEquipos } from "@/domain/informeEquipos";
import { informeLocativaHtml, nombreArchivoLocativa } from "@/domain/informeLocativa";
import { fotosDe, type Inspeccion } from "@/domain/inspeccion";
import { fotosEnBase64 } from "./fotos";

export type Documento = "informe" | "checklist";

export function nombreArchivo(ins: Inspeccion, doc: Documento): string {
  const base = (() => {
    switch (ins.tipo) {
      case "botiquines": return nombreArchivoBotiquines(ins);
      case "equipos": return nombreArchivoEquipos(ins);
      case "locativas": return nombreArchivoLocativa(ins);
      case "frentes": return nombreArchivoInforme(ins);
    }
  })();
  return doc === "checklist" ? nombreArchivoChecklist(base) : base;
}

export async function htmlDocumento(ins: Inspeccion, doc: Documento): Promise<string> {
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
