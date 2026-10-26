# SST TRACK – Inspecciones SST

App Android (React Native + Expo) para registrar inspecciones SST en campo y generar los informes de OINAC.

## Tipos de inspección

| Tipo | Base | Datos |
| --- | --- | --- |
| Frentes de trabajo | Formato SST-FO-070 V04, control operacional de contratistas | `src/data/sstFo070.ts` |
| Herramientas, equipos y EPP | Informes de equipos contra caídas y de LOTO / dieléctricos (sept. 2026) | `src/data/categoriasEquipos.ts` |
| Botiquines | Formato SST-FO-077 V01 | `src/data/botiquin.ts` |
| Condiciones locativas | Informe de baños de contratistas CCNC (oct. 2026) | `src/data/listasLocativas.ts` |

Los cálculos del SST-FO-070 (cumplimiento, calificación, decisión y plan de acción) están en `src/domain/controlOperacional.ts`.

## Comandos

```bash
npm install
npm test           # pruebas
npm run typecheck  # TypeScript
npx expo start     # servidor de desarrollo
```
