/** Spiel-ID und Persistenz (Schritt 1: lokaler Speicher). */
export const GAME_ID = "gamblers-table";
export const LOCAL_SAVE_KEY = "gt_gamblers_table_save_v1";
export const SAVE_SCHEMA_VERSION = 1;

export const AUTOSAVE_MS = 10_000;
export const COMBO_WINDOW_MS = 1400;

/** Prestige-Schwelle wie v2: PRESTIGE_BASE * PRESTIGE_GROWTH^prestige */
export const PRESTIGE_BASE = 9000;
export const PRESTIGE_GROWTH = 1.5;
