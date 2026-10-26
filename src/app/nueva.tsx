// Nueva inspección: tipo y encabezado. En frentes, también las actividades críticas en ejecución.
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { CATEGORIAS_EQUIPOS } from "@/data/categoriasEquipos";
import { LISTAS_LOCATIVAS } from "@/data/listasLocativas";
import { SST_FO_070 } from "@/data/sstFo070";
import {
  nuevaInspeccionBotiquines,
  nuevaInspeccionEquipos,
  nuevaInspeccionFrente,
  nuevaInspeccionLocativa,
  type EncabezadoFrente,
  type Inspeccion,
  type InspeccionFrente,
} from "@/domain/inspeccion";
import type { InspeccionBotiquines } from "@/domain/botiquines";
import type { InspeccionEquipos } from "@/domain/equipos";
import { listaDe, objetivoPorDefecto, type EncabezadoLocativa, type InspeccionLocativa } from "@/domain/locativas";
import { TIPOS_INSPECCION, type TipoInspeccion } from "@/domain/tipos";
import { guardar, listar } from "@/db/inspecciones";
import { rutaInspeccion } from "@/ui/rutas";
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

const CAMPOS_LOCATIVA: [keyof EncabezadoLocativa, string][] = [
  ["proyecto", "Proyecto"],
  ["area", "Sede / área inspeccionada"],
  ["responsableArea", "Responsable del área"],
  ["tipoInspeccion", "Tipo de inspección (Planeada, No planeada…)"],
  ["fecha", "Fecha de inspección (AAAA-MM-DD)"],
  ["elaboradoPor", "Inspeccionado por"],
  ["cargoElaboro", "Cargo de quien inspecciona"],
];

const OPCIONALES = SST_FO_070.filter((b) => !b.siempre);
const fechaValida = (f: string) => /^\d{4}-\d{2}-\d{2}$/.test(f);
const seleccion = (on: boolean) => on && { borderColor: color.azul, backgroundColor: color.tinte };

export default function Nueva() {
  const db = useSQLiteContext();
  const [tipo, setTipo] = useState<TipoInspeccion>("frentes");
  const [frente, setFrente] = useState<InspeccionFrente>(() => nuevaInspeccionFrente());
  const [locativa, setLocativa] = useState<InspeccionLocativa>(() => nuevaInspeccionLocativa());
  const [anteriorEquipos, setAnteriorEquipos] = useState<InspeccionEquipos>();
  const [botiquines, setBotiquines] = useState<InspeccionBotiquines>(() => nuevaInspeccionBotiquines());

  // Reutiliza proyecto y personas de la última inspección del mismo tipo.
  useEffect(() => {
    listar(db).then((l) => {
      const f = l.find((i) => i.tipo === "frentes");
      if (f) setFrente((x) => ({ ...nuevaInspeccionFrente(f), id: x.id }));
      const loc = l.find((i) => i.tipo === "locativas");
      if (loc) setLocativa((x) => ({ ...nuevaInspeccionLocativa(x.listaId, loc), id: x.id, puntos: x.puntos }));
      const eq = l.find((i) => i.tipo === "equipos");
      if (eq) setAnteriorEquipos(eq);
      const bot = l.find((i) => i.tipo === "botiquines");
      if (bot) setBotiquines((x) => ({ ...nuevaInspeccionBotiquines(bot), id: x.id }));
    });
  }, [db]);

  async function crear(ins: Inspeccion) {
    await guardar(db, ins);
    router.replace(rutaInspeccion(ins));
  }

  return (
    <ScrollView style={est.pantalla} contentContainerStyle={est.contenido} keyboardShouldPersistTaps="handled">
      <View style={est.tarjeta}>
        <Text style={est.subtitulo}>Tipo de inspección</Text>
        {(Object.keys(TIPOS_INSPECCION) as TipoInspeccion[]).map((t) => (
          <Pressable key={t} onPress={() => setTipo(t)} style={[est.input, seleccion(tipo === t)]}>
            <Text style={est.texto}>{TIPOS_INSPECCION[t]}</Text>
          </Pressable>
        ))}
      </View>

      {tipo === "frentes" && <FormFrente ins={frente} setIns={setFrente} onCrear={() => crear(frente)} />}
      {tipo === "locativas" && <FormLocativa ins={locativa} setIns={setLocativa} onCrear={() => crear(locativa)} />}
      {tipo === "botiquines" && <FormBotiquines ins={botiquines} setIns={setBotiquines} onCrear={() => crear(botiquines)} />}
      {tipo === "equipos" && <FormEquipos key={anteriorEquipos?.id ?? "nueva"} anterior={anteriorEquipos} onCrear={crear} />}
    </ScrollView>
  );
}

interface FormProps<T> {
  ins: T;
  setIns: (f: (x: T) => T) => void;
  onCrear: () => void;
}

function FormFrente({ ins, setIns, onCrear }: FormProps<InspeccionFrente>) {
  const setCampo = (k: keyof EncabezadoFrente, v: string) => setIns((x) => ({ ...x, encabezado: { ...x.encabezado, [k]: v } }));
  const alternar = (p: string) =>
    setIns((x) => ({
      ...x,
      actividadesCriticas: x.actividadesCriticas.includes(p) ? x.actividadesCriticas.filter((a) => a !== p) : [...x.actividadesCriticas, p],
    }));

  const listo = ins.encabezado.contratista.trim() && fechaValida(ins.encabezado.fecha);

  return (
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
            <Pressable key={b.prefijo} onPress={() => alternar(b.prefijo)} style={[est.input, seleccion(on)]}>
              <Text style={est.texto}>{on ? "☑" : "☐"}  {b.numero}. {b.titulo}</Text>
            </Pressable>
          );
        })}
        <Text style={est.etiqueta}>Descripción de las actividades</Text>
        <TextInput style={[est.input, { minHeight: 70 }]} multiline value={ins.encabezado.actividadesTexto} onChangeText={(v) => setCampo("actividadesTexto", v)} />
      </View>

      <Pressable style={[est.boton, !listo && { opacity: 0.5 }]} disabled={!listo} onPress={onCrear}>
        <Text style={est.botonTexto}>Empezar verificación</Text>
      </Pressable>
      {!listo && <Text style={est.tenue}>Escribe el contratista y una fecha válida para continuar.</Text>}
    </>
  );
}

function FormLocativa({ ins, setIns, onCrear }: FormProps<InspeccionLocativa>) {
  const setCampo = (k: keyof EncabezadoLocativa, v: string) => setIns((x) => ({ ...x, encabezado: { ...x.encabezado, [k]: v } }));
  const elegirLista = (listaId: string) =>
    setIns((x) => {
      // El objetivo sugerido cambia con el área, salvo que ya se haya editado.
      const objetivo = x.objetivo === objetivoPorDefecto(listaDe(x)) ? objetivoPorDefecto(listaDe({ listaId })) : x.objetivo;
      return { ...x, listaId, objetivo };
    });

  const listo = ins.encabezado.area.trim() && fechaValida(ins.encabezado.fecha);

  return (
    <>
      <View style={est.tarjeta}>
        <Text style={est.subtitulo}>¿Qué se inspecciona?</Text>
        {LISTAS_LOCATIVAS.map((l) => (
          <Pressable key={l.id} onPress={() => elegirLista(l.id)} style={[est.input, seleccion(ins.listaId === l.id)]}>
            <Text style={est.texto}>{l.nombre}{l.validada ? "" : " (lista en borrador)"}</Text>
          </Pressable>
        ))}
        {!listaDe(ins).validada && <Text style={est.tenue}>Los aspectos de esta lista aún no están validados por SST OINAC.</Text>}
      </View>

      <View style={est.tarjeta}>
        <Text style={est.subtitulo}>Datos generales</Text>
        {CAMPOS_LOCATIVA.map(([k, label]) => (
          <View key={k} style={{ gap: 4 }}>
            <Text style={est.etiqueta}>{label}</Text>
            <TextInput style={est.input} value={ins.encabezado[k]} onChangeText={(v) => setCampo(k, v)} />
          </View>
        ))}
      </View>

      <Pressable style={[est.boton, !listo && { opacity: 0.5 }]} disabled={!listo} onPress={onCrear}>
        <Text style={est.botonTexto}>Empezar inspección</Text>
      </Pressable>
      {!listo && <Text style={est.tenue}>Escribe la sede o área y una fecha válida para continuar.</Text>}
    </>
  );
}

function FormEquipos({ anterior, onCrear }: { anterior?: InspeccionEquipos; onCrear: (ins: InspeccionEquipos) => void }) {
  const [cats, setCats] = useState<string[]>(() => anterior?.secciones.map((s) => s.categoriaId) ?? []);
  const [copiar, setCopiar] = useState(!!anterior);
  const [enc, setEnc] = useState<EncabezadoLocativa>(() => nuevaInspeccionEquipos([], anterior).encabezado);

  const alternar = (id: string) => setCats((x) => (x.includes(id) ? x.filter((c) => c !== id) : [...x, id]));
  const listo = cats.length > 0 && enc.area.trim() && fechaValida(enc.fecha);

  function crear() {
    // Las secciones siguen el orden del catálogo.
    const orden = CATEGORIAS_EQUIPOS.map((c) => c.id).filter((c) => cats.includes(c));
    onCrear({ ...nuevaInspeccionEquipos(orden, anterior, copiar), encabezado: enc });
  }

  return (
    <>
      <View style={est.tarjeta}>
        <Text style={est.subtitulo}>Equipos a inspeccionar</Text>
        {CATEGORIAS_EQUIPOS.map((c) => {
          const on = cats.includes(c.id);
          return (
            <Pressable key={c.id} onPress={() => alternar(c.id)} style={[est.input, seleccion(on)]}>
              <Text style={est.texto}>{on ? "☑" : "☐"}  {c.nombre}</Text>
            </Pressable>
          );
        })}
        {anterior && (
          <Pressable onPress={() => setCopiar(!copiar)} style={[est.input, seleccion(copiar)]}>
            <Text style={est.texto}>{copiar ? "☑" : "☐"}  Partir de los equipos de la inspección del {anterior.encabezado.fecha.split("-").reverse().join("/")}</Text>
          </Pressable>
        )}
      </View>

      <View style={est.tarjeta}>
        <Text style={est.subtitulo}>Datos generales</Text>
        {CAMPOS_LOCATIVA.map(([k, label]) => (
          <View key={k} style={{ gap: 4 }}>
            <Text style={est.etiqueta}>{label}</Text>
            <TextInput style={est.input} value={enc[k]} onChangeText={(v) => setEnc((x) => ({ ...x, [k]: v }))} />
          </View>
        ))}
      </View>

      <Pressable style={[est.boton, !listo && { opacity: 0.5 }]} disabled={!listo} onPress={crear}>
        <Text style={est.botonTexto}>Empezar inspección</Text>
      </Pressable>
      {!listo && <Text style={est.tenue}>Elige al menos una categoría y escribe el área y una fecha válida para continuar.</Text>}
    </>
  );
}

function FormBotiquines({ ins, setIns, onCrear }: FormProps<InspeccionBotiquines>) {
  const setCampo = (k: keyof EncabezadoLocativa, v: string) => setIns((x) => ({ ...x, encabezado: { ...x.encabezado, [k]: v } }));
  const listo = ins.encabezado.area.trim() && fechaValida(ins.encabezado.fecha);

  return (
    <>
      <View style={est.tarjeta}>
        <Text style={est.subtitulo}>Datos generales (SST-FO-077)</Text>
        {CAMPOS_LOCATIVA.map(([k, label]) => (
          <View key={k} style={{ gap: 4 }}>
            <Text style={est.etiqueta}>{k === "elaboradoPor" ? "Inspeccionado por" : label}</Text>
            <TextInput style={est.input} value={ins.encabezado[k]} onChangeText={(v) => setCampo(k, v)} />
          </View>
        ))}
        {ins.botiquines.some((b) => b.area) && (
          <Text style={est.tenue}>Se repiten los botiquines de la inspección anterior: {ins.botiquines.map((b) => b.area).filter(Boolean).join(", ")}.</Text>
        )}
      </View>

      <Pressable style={[est.boton, !listo && { opacity: 0.5 }]} disabled={!listo} onPress={onCrear}>
        <Text style={est.botonTexto}>Empezar inspección</Text>
      </Pressable>
      {!listo && <Text style={est.tenue}>Escribe la sede o área y una fecha válida para continuar.</Text>}
    </>
  );
}
