// Dónde guarda Supabase la sesión en el teléfono: en SQLite, para que siga abierta sin conexión.
import "react-native-url-polyfill/auto";
import Storage from "expo-sqlite/kv-store";

export const almacenSesion = Storage;
