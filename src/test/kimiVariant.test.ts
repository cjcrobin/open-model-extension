import { describe, it, expect, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { resetMockConfig, setMockConfig } from './__mocks__/vscode';
import { applyKimiVariant, resolveKimiVariant } from '../utils/kimiVariant';
import { KIMI_VARIANT_METADATA } from '../types';

describe('resolveKimiVariant', () => {
  beforeEach(() => {
    resetMockConfig();
  });

  it('returns "ai-platform" when baseUrl is unset (falls back to moonshot default)', () => {
    expect(resolveKimiVariant()).toBe('ai-platform');
  });

  it('returns "ai-platform" for the moonshot URL', () => {
    setMockConfig('openModel.kimi', 'baseUrl', 'https://api.moonshot.cn/v1');
    expect(resolveKimiVariant()).toBe('ai-platform');
  });

  it('returns "code" for the Kimi coding gateway URL', () => {
    setMockConfig('openModel.kimi', 'baseUrl', 'https://api.kimi.com/coding/v1');
    expect(resolveKimiVariant()).toBe('code');
  });

  it('returns "code" when the coding URL has a trailing /v1', () => {
    setMockConfig('openModel.kimi', 'baseUrl', 'https://api.kimi.com/coding/v1');
    expect(resolveKimiVariant()).toBe('code');
  });

  it('falls back to "ai-platform" for an unknown proxy URL', () => {
    setMockConfig('openModel.kimi', 'baseUrl', 'https://proxy.example.com/v1');
    expect(resolveKimiVariant()).toBe('ai-platform');
  });
});

describe('applyKimiVariant', () => {
  beforeEach(() => {
    resetMockConfig();
  });

  it('writes baseUrl + extraHeaders + defaultModels for Code', async () => {
    await applyKimiVariant('code');

    const cfg = vscode.workspace.getConfiguration('openModel.kimi');
    expect(cfg.get('baseUrl')).toBe(KIMI_VARIANT_METADATA.code.baseUrl);
    expect(cfg.get('extraHeaders')).toEqual(KIMI_VARIANT_METADATA.code.extraHeaders);
    const models = cfg.get<Array<{ id: string }>>('models', []);
    expect(models.map((m) => m.id)).toEqual(['kimi-for-coding']);
  });

  it('writes baseUrl + empty extraHeaders + defaultModels for AI Platform', async () => {
    await applyKimiVariant('ai-platform');

    const cfg = vscode.workspace.getConfiguration('openModel.kimi');
    expect(cfg.get('baseUrl')).toBe(KIMI_VARIANT_METADATA['ai-platform'].baseUrl);
    expect(cfg.get('extraHeaders')).toEqual({});
    const models = cfg.get<Array<{ id: string }>>('models', []);
    expect(models.map((m) => m.id)).toEqual(['kimi-k2.6', 'kimi-k2.5']);
  });

  it('preserves user-customised models when switching variant', async () => {
    setMockConfig('openModel.kimi', 'models', [
      { id: 'my-custom-model', name: 'Custom' },
    ]);

    await applyKimiVariant('code');

    const cfg = vscode.workspace.getConfiguration('openModel.kimi');
    const models = cfg.get<Array<{ id: string }>>('models', []);
    expect(models.map((m) => m.id)).toEqual(['my-custom-model']);
  });

  it('overwrites models that exactly match the OTHER variant defaults', async () => {
    setMockConfig('openModel.kimi', 'models', [
      { id: 'kimi-k2.6', name: 'Kimi K2.6' },
      { id: 'kimi-k2.5', name: 'Kimi K2.5' },
    ]);

    await applyKimiVariant('code');

    const cfg = vscode.workspace.getConfiguration('openModel.kimi');
    const models = cfg.get<Array<{ id: string }>>('models', []);
    expect(models.map((m) => m.id)).toEqual(['kimi-for-coding']);
  });

  it('round-trips: apply code then resolve returns code', async () => {
    await applyKimiVariant('code');
    expect(resolveKimiVariant()).toBe('code');
  });
});
