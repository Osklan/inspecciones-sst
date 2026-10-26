// Pantalla de verificación según el tipo de inspección.
import type { Inspeccion } from "@/domain/inspeccion";

export const rutaInspeccion = (i: Pick<Inspeccion, "id" | "tipo">) =>
  i.tipo === "locativas"
    ? ({ pathname: "/locativa/[id]", params: { id: i.id } } as const)
    : i.tipo === "equipos"
      ? ({ pathname: "/equipos/[id]", params: { id: i.id } } as const)
      : ({ pathname: "/inspeccion/[id]", params: { id: i.id } } as const);
