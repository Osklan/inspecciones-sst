// Almacenamiento local (SQLite) de las inspecciones: funciona sin conexión.
import type { SQLiteDatabase } from "expo-sqlite";
import type { Inspeccion } from "@/domain/inspeccion";

const VERSION_BD = 1;

export async function migrar(db: SQLiteDatabase): Promise<void> {
  const fila = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const actual = fila?.user_version ?? 0;
  if (actual >= VERSION_BD) return;
  if (actual === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE IF NOT EXISTS inspecciones (
        id TEXT PRIMARY KEY NOT NULL,
        tipo TEXT NOT NULL,
        actualizado INTEGER NOT NULL,
        datos TEXT NOT NULL
      );
    `);
  }
  await db.execAsync(`PRAGMA user_version = ${VERSION_BD}`);
}

export async function listar(db: SQLiteDatabase): Promise<Inspeccion[]> {
  const filas = await db.getAllAsync<{ datos: string }>("SELECT datos FROM inspecciones ORDER BY actualizado DESC");
  return filas.map((f) => JSON.parse(f.datos) as Inspeccion);
}

export async function obtener(db: SQLiteDatabase, id: string): Promise<Inspeccion | null> {
  const f = await db.getFirstAsync<{ datos: string }>("SELECT datos FROM inspecciones WHERE id = ?", id);
  return f ? (JSON.parse(f.datos) as Inspeccion) : null;
}

export async function guardar(db: SQLiteDatabase, ins: Inspeccion): Promise<void> {
  const datos = { ...ins, actualizado: Date.now() };
  await db.runAsync(
    "INSERT OR REPLACE INTO inspecciones (id, tipo, actualizado, datos) VALUES (?, ?, ?, ?)",
    datos.id, datos.tipo, datos.actualizado, JSON.stringify(datos),
  );
}

export async function eliminar(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync("DELETE FROM inspecciones WHERE id = ?", id);
}
