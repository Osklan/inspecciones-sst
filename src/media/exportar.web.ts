// En el navegador el documento se abre en una pestaña nueva y se lanza la impresión: en el
// diálogo se elige «Guardar como PDF». La pestaña se abre al tocar el botón (si se abre después
// de esperar, el navegador la bloquea); si aun así se bloquea, se imprime desde un marco oculto.
import type { Inspeccion } from "@/domain/inspeccion";
import { htmlDocumento, nombreArchivo, type Documento } from "./documentos";

export type { Documento };

export type Destino = Window | null;

export function abrirDestino(): Destino {
  const w = window.open("", "_blank");
  w?.document.write('<p style="font-family:Arial;padding:24px">Generando el documento…</p>');
  return w;
}

export function cerrarDestino(d: Destino): void {
  d?.close();
}

function esperarCarga(w: Window): Promise<void> {
  return new Promise((ok) => {
    if (w.document.readyState === "complete") ok();
    else w.addEventListener("load", () => ok(), { once: true });
    setTimeout(ok, 3000);
  });
}

export async function exportarPdf(ins: Inspeccion, doc: Documento = "informe", destino?: Destino): Promise<string> {
  const nombre = nombreArchivo(ins, doc).replace(/\.pdf$/, "");
  const html = (await htmlDocumento(ins, doc)).replace("<head>", `<head><title>${nombre}</title><meta name="viewport" content="width=device-width, initial-scale=1">`);

  if (destino && !destino.closed) {
    destino.document.open();
    destino.document.write(html);
    destino.document.close();
    await esperarCarga(destino);
    destino.focus();
    destino.print();
    return nombre;
  }

  const marco = document.createElement("iframe");
  marco.setAttribute("aria-hidden", "true");
  Object.assign(marco.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  document.body.appendChild(marco);
  const ventana = marco.contentWindow!;
  ventana.document.open();
  ventana.document.write(html);
  ventana.document.close();
  await esperarCarga(ventana);
  const tituloAnterior = document.title;
  document.title = nombre;
  ventana.focus();
  ventana.print();
  document.title = tituloAnterior;
  setTimeout(() => marco.remove(), 60_000);
  return nombre;
}
