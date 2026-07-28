import type Database from 'better-sqlite3';
import { getSetting, setSetting } from '@mooly/storage';
import type { AppSettings } from '@mooly/shared-types';

const SETTINGS_KEY = 'app_settings';

const DEFAULT_SETTINGS: AppSettings = {
  overlayOpacity: 0.9,
  overlayX: 100,
  overlayY: 100,
  activeProvider: 'stub',
  apiKeys: {}
};

export function getAppSettings(db: Database.Database): AppSettings {
  const raw = getSetting(db, SETTINGS_KEY);
  if (!raw) return structuredClone(DEFAULT_SETTINGS);
  try {
    return { ...structuredClone(DEFAULT_SETTINGS), ...JSON.parse(raw) } as AppSettings;
  } catch (error) {
    console.warn('[settingsStore] failed to parse stored app settings, falling back to defaults', error);
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function setAppSettings(db: Database.Database, partial: Partial<AppSettings>): AppSettings {
  const merged = { ...getAppSettings(db), ...partial };
  setSetting(db, SETTINGS_KEY, JSON.stringify(merged));
  return merged;
}
