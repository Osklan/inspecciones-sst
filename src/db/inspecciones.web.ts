// Almacenamiento de las inspecciones en el navegador (IndexedDB): misma interfaz que inspecciones.ts.
// Cada navegador guarda sus propias inspecciones; las fotos van dentro como data URI.
import type { Inspeccion } from "@/domain/inspeccion";

const NOMBRE = "sst-track";
const TABLA = "inspecciones";

let abierta: Promise<IDBDatabase> | null = null;

function abrir(): Promise<IDBDatabase> {
  abierta ??= new Promise((ok, falla) => {
    const req = indexedDB.open(NOMBRE, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(TABLA, { keyPath: "id" });
    req.onsuccess = () => ok(req.result);
    req.onerror = () => falla(req.error);
  });
  return abierta;
}

async function operar<T>(modo: IDBTransactionMode, op: (t: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await abrir();
  return new Promise((ok, falla) => {
    const req = op(db.transaction(TABLA, modo).objectStore(TABLA));
    req.onsuccess = () => ok(req.result);
    req.onerror = () => falla(req.error);
  });
}

export async function migrar(): Promise<void> {
  await abrir();
}

export async function listar(_db?: unknown): Promise<Inspeccion[]> {
  const todas = await operar<Inspeccion[]>("readonly", (t) => t.getAll());
  return todas.sort((a, b) => b.actualizado - a.actualizado);
}

export async function obtener(_db: unknown, id: string): Promise<Inspeccion | null> {
  return (await operar<Inspeccion | undefined>("readonly", (t) => t.get(id))) ?? null;
}

export async function guardar(_db: unknown, ins: Inspeccion): Promise<void> {
  await operar("readwrite", (t) => t.put({ ...ins, actualizado: Date.now() }));
}

export async function eliminar(_db: unknown, id: string): Promise<void> {
  await operar("readwrite", (t) => t.delete(id));
}
