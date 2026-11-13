// Base de datos local: SQLite en el teléfono (en la web, ver bd.web.tsx).
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from "expo-sqlite";
import type { ReactNode } from "react";
import { migrar } from "./inspecciones";

export type BD = SQLiteDatabase;

export function ProveedorBD({ children }: { children: ReactNode }) {
  return (
    <SQLiteProvider databaseName="inspecciones.db" onInit={migrar}>
      {children}
    </SQLiteProvider>
  );
}

export const useBD = (): BD => useSQLiteContext();
