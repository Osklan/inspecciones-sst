// En el teléfono la app abre sin inicio de sesión (en la web, ver Acceso.web.tsx).
import type { ReactNode } from "react";

export function Acceso({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export const cerrarSesion: (() => Promise<void>) | null = null;
