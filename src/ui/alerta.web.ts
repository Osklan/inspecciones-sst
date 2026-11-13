// En el navegador el Alert de React Native no hace nada: se usan alert() y confirm().
import type { AlertButton } from "react-native";

export const Alert = {
  alert(titulo: string, mensaje?: string, botones?: AlertButton[]): void {
    const texto = mensaje ? `${titulo}\n\n${mensaje}` : titulo;
    const accion = botones?.find((b) => b.style !== "cancel");
    if (!botones || botones.length < 2 || !accion) {
      window.alert(texto);
      accion?.onPress?.();
      return;
    }
    if (window.confirm(texto)) accion.onPress?.();
  },
};
