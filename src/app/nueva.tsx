// Nueva inspección: tipo, encabezado y actividades críticas en ejecución.
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SST_FO_070 } from "@/data/sstFo070";
import { nuevaInspeccionFrente, type EncabezadoFrente, type InspeccionFrente } from "@/domain/inspeccion";
import { TIPOS_INSPECCION, type TipoInspeccion } from "@/domain/tipos";
import { guardar, listar } from "@/db/inspecciones";
import { color, est } from "@/ui/tema";

const CAMPOS: [keyof EncabezadoFrente, string, "default" | "numeric"][] = [
  ["proyecto", "Proyecto / frente de trabajo", "default"],
  ["contratista", "Contratista", "default"],
  ["ubicacion", "Ubicación", "default"],
  ["trabajadores", "N° de trabajadores", "numeric"],
  ["fecha", "Fecha de verificación (AAAA-MM-DD)", "default"],
  ["hora", "Hora", "default"],
  ["responsableContratista", "Responsable SST contratista", "default"],
  ["verificadoPor", "Verificado por (SST OINAC)", "default"],
];

const OPCIONALES = SST_FO_070.filter((b) => !b.siempre);

export default function Nueva() {
  const db = useSQLiteContext();
  const [tipo, setTipo] = useState<TipoInspeccion>("frentes");
  const [ins, setIns] = useState<InspeccionFrente>(() => nuevaInspeccionFrente());

  // Reutiliza proyecto y verificador de la última inspección de frentes.
  useEffect(() => {
    listar(db).then((l) => {
      const ult = l.find((i) => i.tipo === "frentes");
      if (ult) setIns((x) => ({ ...nuevaInspeccionFrente(ult), id: x.id }));
    });
  }, [db]);

  const setCampo = (k: keyof EncabezadoFrente, v: string) => setIns((x) => ({ ...x, encabezado: { ...x.encabezado, [k]: v } }));
  const alternar = (p: string) =>
    setIns((x) => ({
      ...x,
      actividadesCriticas: x.actividadesCriticas.includes(p) ? x.actividadesCriticas.filter((a) => a !== p) : [...x.actividadesCriticas, p],
    }));

  const listo = ins.encabezado.contratista.trim() && /^\d{4}-\d{2}-\d{2}$/.test(ins.encabezado.fecha);

  async function crear() {
    await guardar(db, ins);
    router.replace({ pathname: "/inspeccion/[id]", params: { id: ins.id } });
  }

  return (
    <ScrollView style={est.pantalla} contentContainerStyle={est.contenido} keyboardShouldPersistTaps="handled">
      <View style={est.tarjeta}>
        <Text style={est.subtitulo}>Tipo de inspección</Text>
        {(Object.keys(TIPOS_INSPECCION) as TipoInspeccion[]).map((t) => (
          <Pressable key={t} onPress={() => setTipo(t)} style={[est.input, tipo === t && { borderColor: color.azul, backgroundColor: color.tinte }]}>
            <Text style={est.texto}>{TIPOS_INSPECCION[t]}{t !== "frentes" ? " (próximamente)" : ""}</Text>
          </Pressable>
        ))}
      </View>

      {tipo !== "frentes" ? (
        <View style={est.tarjeta}>
          <Text style={est.texto}>Este tipo de inspección llega en la siguiente versión.</Text>
        </View>
      ) : (
        <>
          <View style={est.tarjeta}>
            <Text style={est.subtitulo}>Información general (SST-FO-070)</Text>
            {CAMPOS.map(([k, label, teclado]) => (
              <View key={k} style={{ gap: 4 }}>
                <Text style={est.etiqueta}>{label}</Text>
                <TextInput style={est.input} value={ins.encabezado[k]} onChangeText={(v) => setCampo(k, v)} keyboardType={teclado} />
              </View>
            ))}
          </View>

          <View style={est.tarjeta}>
            <Text style={est.subtitulo}>Actividades críticas en ejecución</Text>
            <Text style={est.tenue}>Solo se verifican los bloques marcados, además de los generales. Los demás quedan como NA.</Text>
            {OPCIONALES.map((b) => {
              const on = ins.actividadesCriticas.includes(b.prefijo);
              return (
                <Pressable key={b.prefijo} onPress={() => alternar(b.prefijo)} style={[est.input, on && { borderColor: color.azul, backgroundColor: color.tinte }]}>
                  <Text style={est.texto}>{on ? "☑" : "☐"}  {b.numero}. {b.titulo}</Text>
                </Pressable>
              );
            })}
            <Text style={est.etiqueta}>Descripción de las actividades</Text>
            <TextInput style={[est.input, { minHeight: 70 }]} multiline value={ins.encabezado.actividadesTexto} onChangeText={(v) => setCampo("actividadesTexto", v)} />
          </View>

          <Pressable style={[est.boton, !listo && { opacity: 0.5 }]} disabled={!listo} onPress={crear}>
            <Text style={est.botonTexto}>Empezar verificación</Text>
          </Pressable>
          {!listo && <Text style={est.tenue}>Escribe el contratista y una fecha válida para continuar.</Text>}
        </>
      )}
    </ScrollView>
  );
}
