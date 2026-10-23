import { describe, expect, it } from "vitest";
import { firmaSvg, firmaVacia, trazoDesdePuntos } from "./firma";

describe("firma", () => {
  it("convierte puntos en un trazo SVG y un toque en un punto", () => {
    expect(trazoDesdePuntos([{ x: 1.234, y: 2 }, { x: 3, y: 4.56 }])).toBe("M1.2 2 L3 4.6");
    expect(trazoDesdePuntos([{ x: 5, y: 5 }])).toBe("M5 5 l0.1 0");
    expect(trazoDesdePuntos([])).toBe("");
  });

  it("genera un SVG con su tamaño y limpia caracteres extraños", () => {
    const svg = firmaSvg({ trazos: ['M1 2 L3 4"/><script>'], ancho: 300, alto: 160, fecha: 0 });
    expect(svg).toContain('viewBox="0 0 300 160"');
    expect(svg).toContain('d="M1 2 L3 4"');
    expect(svg).not.toContain("<script>");
  });

  it("detecta firmas vacías", () => {
    expect(firmaVacia(undefined)).toBe(true);
    expect(firmaVacia({ trazos: [], ancho: 1, alto: 1, fecha: 0 })).toBe(true);
    expect(firmaVacia({ trazos: ["M1 1 l0.1 0"], ancho: 1, alto: 1, fecha: 0 })).toBe(false);
  });
});
