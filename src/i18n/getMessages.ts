// src/i18n/getMessages.ts
import fs from 'fs';
import path from 'path';
import type { Locale } from '@/src/lib/i18n';

// Ta langue "source" (celle où tu es sûr d'avoir toutes les clés)
const DEFAULT_LOCALE: Locale = 'fr';

// Messages = { [namespace: string]: any }
export type Messages = Record<string, any>;

// Cache par locale (pour éviter de relire le disque à chaque demande)
const cache = new Map<Locale, Messages>();

// ⬇️ ICI on pointe vers le dossier "messages" à la racine du projet
const MESSAGES_ROOT = path.join(process.cwd(), 'messages');

function loadLocaleFromFs(locale: Locale): Messages {
  const dir = path.join(MESSAGES_ROOT, locale);
  const result: Messages = {};

  let files: string[] = [];
  try {
    files = fs.readdirSync(dir);
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[i18n] No message directory for locale "${locale}" at ${dir}`
      );
    }
    return result;
  }

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const namespace = file.replace(/\.json$/, '');
    const fullPath = path.join(dir, file);

    try {
      const raw = fs.readFileSync(fullPath, 'utf8');
      const json = JSON.parse(raw);
      result[namespace] = json;
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[i18n] Failed to load messages file "${fullPath}" for locale "${locale}"`,
          err
        );
      }
    }
  }

  return result;
}

export async function getMessages(locale: Locale): Promise<Messages> {
  const cached = cache.get(locale);
  if (cached) return cached;

  // 1) messages pour la locale demandée (peut être vide si pas de dossier/en)
  const primary = loadLocaleFromFs(locale);

  // 2) fallback sur DEFAULT_LOCALE pour les namespaces manquants
  let merged: Messages = { ...primary };

  if (locale !== DEFAULT_LOCALE) {
    const fallback = loadLocaleFromFs(DEFAULT_LOCALE);

    for (const [ns, value] of Object.entries(fallback)) {
      if (merged[ns] === undefined) {
        merged[ns] = value;
      }
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(
      '[i18n] Loaded messages for locale',
      locale,
      'namespaces:',
      Object.keys(merged)
    );
  }

  cache.set(locale, merged);
  return merged;
}
