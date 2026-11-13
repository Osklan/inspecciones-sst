// En el navegador las inspecciones se guardan en IndexedDB (ver inspecciones.web.ts), sin proveedor.
import { Fragment, type ReactNode } from "react";

export type BD = null;

export function ProveedorBD({ children }: { children: ReactNode }) {
  return <Fragment>{children}</Fragment>;
}

export const useBD = (): BD => null;
