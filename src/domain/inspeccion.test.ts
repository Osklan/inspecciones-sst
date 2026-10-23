import { describe, expect, it } from "vitest";
import { nuevaInspeccionFrente, PROYECTO_POR_DEFECTO, tituloInspeccion } from "./inspeccion";

describe("nueva inspección de frente", () => {
  const ahora = new Date(2026, 9, 23, 7, 5);

  it("trae fecha y hora actuales y el proyecto por defecto", () => {
    const i = nuevaInspeccionFrente(undefined, ahora);
    expect(i.encabezado.fecha).toBe("2026-10-23");
    expect(i.encabezado.hora).toBe("07:05");
    expect(i.encabezado.proyecto).toBe(PROYECTO_POR_DEFECTO);
    expect(i.respuestas).toEqual({});
  });

  it("reutiliza proyecto y verificador de la anterior, no el contratista", () => {
    const prev = nuevaInspeccionFrente(undefined, ahora);
    prev.encabezado = { ...prev.encabezado, proyecto: "Obra X", verificadoPor: "Osneider Mercado", contratista: "LEGGO" };
    const i = nuevaInspeccionFrente(prev, ahora);
    expect(i.encabezado.proyecto).toBe("Obra X");
    expect(i.encabezado.verificadoPor).toBe("Osneider Mercado");
    expect(i.encabezado.contratista).toBe("");
    expect(tituloInspeccion(i)).toBe("Sin contratista");
  });
});
