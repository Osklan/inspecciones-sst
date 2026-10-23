// Panel para firmar con el dedo. Guarda los trazos como SVG.
import { useRef, useState } from "react";
import { PanResponder, Pressable, Text, View, type LayoutChangeEvent } from "react-native";
import Svg, { Path } from "react-native-svg";
import { firmaVacia, trazoDesdePuntos, type Firma, type Punto } from "@/domain/firma";
import { color, est } from "./tema";

const ALTO = 160;

interface Props {
  titulo: string;
  nombre: string;
  firma?: Firma;
  onCambio: (f: Firma | undefined) => void;
  /** Se llama al empezar y terminar de firmar, para bloquear el desplazamiento de la pantalla. */
  onFirmando?: (activo: boolean) => void;
}

export function PanelFirma({ titulo, nombre, firma, onCambio, onFirmando }: Props) {
  const [ancho, setAncho] = useState(300);
  const [trazos, setTrazos] = useState<string[]>(firma?.trazos ?? []);
  const [actual, setActual] = useState("");
  const puntos = useRef<Punto[]>([]);
  // Las funciones del PanResponder se crean una vez: leen el estado más reciente por refs.
  const estado = useRef({ trazos, ancho });
  estado.current = { trazos, ancho };

  const terminar = () => {
    const d = trazoDesdePuntos(puntos.current);
    puntos.current = [];
    setActual("");
    onFirmando?.(false);
    if (!d) return;
    const nuevos = [...estado.current.trazos, d];
    setTrazos(nuevos);
    onCambio({ trazos: nuevos, ancho: Math.round(estado.current.ancho), alto: ALTO, fecha: Date.now() });
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (ev) => {
        onFirmando?.(true);
        puntos.current = [{ x: ev.nativeEvent.locationX, y: ev.nativeEvent.locationY }];
        setActual(trazoDesdePuntos(puntos.current));
      },
      onPanResponderMove: (ev) => {
        puntos.current.push({ x: ev.nativeEvent.locationX, y: ev.nativeEvent.locationY });
        setActual(trazoDesdePuntos(puntos.current));
      },
      onPanResponderRelease: terminar,
      onPanResponderTerminate: terminar,
    }),
  ).current;

  const limpiar = () => {
    setTrazos([]);
    onCambio(undefined);
  };

  const vacia = firmaVacia({ trazos, ancho, alto: ALTO, fecha: 0 }) && !actual;

  return (
    <View style={est.tarjeta}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexShrink: 1 }}>
          <Text style={est.subtitulo}>{titulo}</Text>
          <Text style={est.tenue}>{nombre || "Sin nombre en el encabezado"}</Text>
        </View>
        {!vacia && (
          <Pressable onPress={limpiar} style={[est.input, { paddingVertical: 6 }]}>
            <Text style={est.texto}>Borrar</Text>
          </Pressable>
        )}
      </View>
      <View
        onLayout={(e: LayoutChangeEvent) => setAncho(e.nativeEvent.layout.width)}
        style={{ height: ALTO, borderWidth: 1, borderColor: color.linea, borderStyle: "dashed", borderRadius: 8, backgroundColor: "#FFFFFF" }}
        {...pan.panHandlers}
      >
        <Svg width="100%" height={ALTO} pointerEvents="none">
          {[...trazos, actual].filter(Boolean).map((d, i) => (
            <Path key={i} d={d} stroke="#0B2A5B" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </Svg>
        {vacia && (
          <Text pointerEvents="none" style={[est.tenue, { position: "absolute", alignSelf: "center", top: ALTO / 2 - 10 }]}>
            Firme aquí con el dedo
          </Text>
        )}
      </View>
    </View>
  );
}
