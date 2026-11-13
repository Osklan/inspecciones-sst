// Solo entra quien tenga usuario en el proyecto de Supabase de OINAC, en la web y en el teléfono:
// los usuarios los crea el administrador en Authentication → Users (el registro abierto está
// desactivado). La sesión queda guardada, así que en campo la app abre aunque no haya señal.
import { createClient, type Session } from "@supabase/supabase-js";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, AppState, Image, Platform, Pressable, Text, TextInput, View } from "react-native";
import { color, est } from "@/ui/tema";
import { almacenSesion } from "./almacen";
import { SUPABASE_CLAVE_PUBLICA, SUPABASE_URL } from "./config";

const cliente = SUPABASE_URL
  ? createClient(SUPABASE_URL, SUPABASE_CLAVE_PUBLICA, {
      auth: { storage: almacenSesion, persistSession: true, autoRefreshToken: true, detectSessionInUrl: Platform.OS === "web" },
    })
  : null;

// En el teléfono el token solo se renueva mientras la app está en primer plano.
if (cliente && Platform.OS !== "web") {
  AppState.addEventListener("change", (estado) => {
    if (estado === "active") cliente.auth.startAutoRefresh();
    else cliente.auth.stopAutoRefresh();
  });
}

export const cerrarSesion = cliente ? async () => { await cliente.auth.signOut(); } : null;

export function Acceso({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Session | null | undefined>(cliente ? undefined : null);

  useEffect(() => {
    if (!cliente) return;
    cliente.auth.getSession().then(({ data }) => setSesion(data.session));
    const { data } = cliente.auth.onAuthStateChange((_e, s) => setSesion(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!cliente) return <>{children}</>;
  if (sesion === undefined) return <View style={[est.pantalla, { justifyContent: "center" }]}><ActivityIndicator color={color.azul} /></View>;
  if (!sesion) return <Ingreso />;
  return <>{children}</>;
}

function Ingreso() {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function entrar() {
    setError("");
    setEntrando(true);
    const { error: e } = await cliente!.auth.signInWithPassword({ email: correo.trim(), password: clave });
    setEntrando(false);
    if (e) setError(e.message === "Invalid login credentials" ? "Correo o contraseña incorrectos." : e.message);
  }

  return (
    <View style={[est.pantalla, { justifyContent: "center", alignItems: "center", padding: 16 }]}>
      <View style={[est.tarjeta, { width: "100%", maxWidth: 380 }]}>
        <Image source={require("../../assets/logo-sst-track.png")} style={{ width: 120, height: 120, alignSelf: "center" }} />
        <Text style={[est.subtitulo, { textAlign: "center" }]}>Ingreso a SST TRACK</Text>
        <Text style={est.etiqueta}>Correo</Text>
        <TextInput style={est.input} value={correo} onChangeText={setCorreo} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Text style={est.etiqueta}>Contraseña</Text>
        <TextInput style={est.input} value={clave} onChangeText={setClave} secureTextEntry autoComplete="current-password" onSubmitEditing={entrar} />
        {!!error && <Text style={[est.texto, { color: color.rojo }]}>{error}</Text>}
        <Pressable style={[est.boton, entrando && { opacity: 0.6 }]} disabled={entrando || !correo || !clave} onPress={entrar}>
          <Text style={est.botonTexto}>{entrando ? "Entrando…" : "Entrar"}</Text>
        </Pressable>
        <Text style={[est.tenue, { textAlign: "center" }]}>Si no tienes usuario, pídelo al administrador de SST.</Text>
      </View>
    </View>
  );
}
