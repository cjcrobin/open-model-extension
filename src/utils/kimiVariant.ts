import * as vscode from 'vscode';
import {
  KIMI_VARIANT_METADATA,
  KimiVariant,
  ModelConfig,
  PROVIDER_METADATA,
} from '../types';

const KIMI_SECTION = 'openModel.kimi';

/**
 * Infer the active Kimi variant from `openModel.kimi.baseUrl`.
 *
 * - Any URL containing "kimi.com/coding" is treated as the Coding gateway.
 * - Everything else (including unset / unknown proxies) falls back to
 *   'ai-platform' — the safer default that does NOT inject the KimiCLI UA.
 */
export function resolveKimiVariant(): KimiVariant {
  const baseUrl = vscode.workspace
    .getConfiguration(KIMI_SECTION)
    .get<string>('baseUrl', PROVIDER_METADATA.kimi.baseUrl);
  return typeof baseUrl === 'string' && baseUrl.includes('kimi.com/coding')
    ? 'code'
    : 'ai-platform';
}

/**
 * Persist the chosen variant's baseUrl / extraHeaders / defaultModels into
 * settings.json (Global scope).
 *
 * Models are only overwritten when the user's current list is empty or looks
 * exactly like the OTHER variant's defaults — custom model lists are never
 * clobbered.
 */
export async function applyKimiVariant(variant: KimiVariant): Promise<void> {
  const meta = KIMI_VARIANT_METADATA[variant];
  const cfg = vscode.workspace.getConfiguration(KIMI_SECTION);

  await cfg.update('baseUrl', meta.baseUrl, vscode.ConfigurationTarget.Global);
  await cfg.update(
    'extraHeaders',
    meta.extraHeaders ?? {},
    vscode.ConfigurationTarget.Global,
  );

  const current = cfg.get<ModelConfig[]>('models', []);
  const otherVariant: KimiVariant = variant === 'code' ? 'ai-platform' : 'code';
  const otherIds = new Set(
    KIMI_VARIANT_METADATA[otherVariant].defaultModels.map((m) => m.id),
  );

  const looksLikeOtherDefaults =
    current.length > 0 && current.every((m) => otherIds.has(m.id));

  if (current.length === 0 || looksLikeOtherDefaults) {
    await cfg.update('models', meta.defaultModels, vscode.ConfigurationTarget.Global);
  }
}
