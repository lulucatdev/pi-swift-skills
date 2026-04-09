import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';

const SETTINGS_DIR = join(os.homedir(), '.pi', 'agent');
const SETTINGS_FILE = join(SETTINGS_DIR, 'settings.json');

export const DEFAULT_TRIGGER_MODE = 'manual';

export function loadSettings() {
  try {
    if (existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(readFileSync(SETTINGS_FILE, 'utf8'));
      return normalizeSettings(data['swift'] || {});
    }
  } catch (e) {
    console.error('Failed to load settings:', e.message);
  }
  return presetDefaults({});
}

export function saveSettings(settings) {
  try {
    if (!existsSync(SETTINGS_DIR)) {
      mkdirSync(SETTINGS_DIR, { recursive: true });
    }
    let data = {};
    if (existsSync(SETTINGS_FILE)) {
      data = JSON.parse(readFileSync(SETTINGS_FILE, 'utf8'));
    }
    data['swift'] = settings;
    writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to save settings:', e.message);
  }
}

export function normalizeSettings(settings) {
  const normalized = { ...settings };
  if (!normalized.triggerMode) {
    normalized.triggerMode = DEFAULT_TRIGGER_MODE;
  }
  if (!normalized.disabledSkills || !Array.isArray(normalized.disabledSkills)) {
    normalized.disabledSkills = [];
  }
  return normalized;
}

export function presetDefaults(settings) {
  return {
    triggerMode: DEFAULT_TRIGGER_MODE,
    disabledSkills: [],
    ...settings
  };
}
