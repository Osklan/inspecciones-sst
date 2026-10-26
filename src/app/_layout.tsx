import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { migrar } from "@/db/inspecciones";
import { color } from "@/ui/tema";

export default function Layout() {
  return (
    <SQLiteProvider databaseName="inspecciones.db" onInit={migrar}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: color.azul },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: color.fondo },
        }}
      >
        <Stack.Screen name="index" options={{ title: "SST TRACK" }} />
        <Stack.Screen name="nueva" options={{ title: "Nueva inspección" }} />
        <Stack.Screen name="inspeccion/[id]" options={{ title: "Verificación" }} />
        <Stack.Screen name="locativa/[id]" options={{ title: "Inspección locativa" }} />
        <Stack.Screen name="equipos/[id]" options={{ title: "Equipos y EPP" }} />
      </Stack>
    </SQLiteProvider>
  );
}
