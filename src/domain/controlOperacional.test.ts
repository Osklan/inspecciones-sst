import { describe, expect, it } from "vitest";
import { SST_FO_070 } from "../data/sstFo070";
import {
  bloquesActivos,
  calcularResultado,
  estadoAccion,
  generarPlanAccion,
  marcarNoAplica,
  sumarDias,
  type Respuestas,
} from "./controlOperacional";

const todos = (r: "C" | "NC" | "NA"): Respuestas =>
  Object.fromEntries(SST_FO_070.flatMap((b) => b.items.map((i) => [i.codigo, { resultado: r }])));

describe("SST-FO-070", () => {
  it("tiene los 105 ítems en 15 bloques del formato V04", () => {
    expect(SST_FO_070).toHaveLength(15);
    expect(SST_FO_070.flatMap((b) => b.items)).toHaveLength(105);
  });

  it("sin respuestas, la inspección queda incompleta y sin calificación", () => {
    const r = calcularResultado(SST_FO_070, {});
    expect(r.sinDiligenciar).toBe(105);
    expect(r.calificacion).toBeNull();
    expect(r.decision).toMatch(/INCOMPLETA/);
  });

  it("todo C da CUMPLE y la actividad puede continuar", () => {
    const r = calcularResultado(SST_FO_070, todos("C"));
    expect(r.total.cumplimiento).toBe(1);
    expect(r.calificacion).toBe("CUMPLE");
    expect(r.decision).toMatch(/^SÍ/);
  });

  it("una NC crítica detiene la actividad aunque la calificación sea CUMPLE", () => {
    const resp = todos("C");
    resp["TRB-01"] = { resultado: "NC", observacion: "Trabajador sin PILA del mes" };
    const r = calcularResultado(SST_FO_070, resp);
    expect(r.ncPorCriticidad["Crítico"]).toBe(1);
    expect(r.calificacion).toBe("CUMPLE");
    expect(r.decision).toMatch(/^NO/);
  });

  it("califica con los umbrales 90 % y 75 %, sin contar los NA", () => {
    const gen = SST_FO_070[0]; // 9 ítems, ninguno crítico
    const resp: Respuestas = {};
    gen.items.forEach((it, i) => (resp[it.codigo] = { resultado: i < 7 ? "C" : "NC" }));
    const r = calcularResultado([gen], resp);
    expect(r.total.cumplimiento).toBeCloseTo(7 / 9);
    expect(r.calificacion).toBe("CUMPLE PARCIALMENTE");
    resp[gen.items[0].codigo] = { resultado: "NA" };
    expect(calcularResultado([gen], resp).total.cumplimiento).toBeCloseTo(6 / 8);
  });

  it("solo activa los bloques de las actividades críticas marcadas", () => {
    const act = bloquesActivos(SST_FO_070, ["ALD", "ALO"]);
    expect(act.map((b) => b.prefijo)).toEqual(["GEN", "TRB", "ALD", "ALO", "EME", "SEN", "COM"]);
    const resp = marcarNoAplica(SST_FO_070, act, {});
    expect(resp["IZA-01"]?.resultado).toBe("NA");
    expect(resp["ALO-01"]).toBeUndefined();
  });

  it("el plan de acción fija la fecha límite según la criticidad", () => {
    const resp: Respuestas = {
      "GEN-02": { resultado: "NC", observacion: "Escombro en zona de paso" },
      "GEN-01": { resultado: "NC" },
      "ALO-04": { resultado: "NC" },
    };
    const plan = generarPlanAccion(SST_FO_070, resp, "2026-10-30");
    expect(plan.map((p) => [p.codigo, p.fechaLimite])).toEqual([
      ["GEN-01", "2026-10-31"],
      ["GEN-02", "2026-11-04"],
      ["ALO-04", "2026-10-30"],
    ]);
    expect(plan[1].hallazgo).toBe("Escombro en zona de paso");
  });

  it("calcula estado y días de atraso", () => {
    const a = generarPlanAccion(SST_FO_070, { "GEN-02": { resultado: "NC" } }, "2026-10-01")[0];
    expect(estadoAccion(a, "2026-10-06")).toEqual({ estado: "Abierto", diasAtraso: 0 });
    expect(estadoAccion(a, "2026-10-09")).toEqual({ estado: "Vencido", diasAtraso: 3 });
    expect(estadoAccion({ ...a, fechaCierre: "2026-10-08" }, "2026-10-20").estado).toBe("Cerrado");
    expect(sumarDias("2026-12-30", 5)).toBe("2027-01-04");
  });
});
