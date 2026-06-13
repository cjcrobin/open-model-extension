import { describe, it, expect } from 'vitest';
import { mergeFetchedModels } from '../utils/mergeModels';
import { FetchedModel, ModelConfig } from '../types';

describe('mergeFetchedModels', () => {
  it('merges new fetched models with existing ones', () => {
    const fetched: FetchedModel[] = [
      { id: 'model-a', object: 'model' },
      { id: 'model-b', object: 'model' },
    ];
    const existing: ModelConfig[] = [
      { id: 'model-a', name: 'Model A', maxInputTokens: 4096 },
    ];

    const result = mergeFetchedModels(fetched, existing);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'model-a', name: 'Model A', maxInputTokens: 4096 });
    expect(result[1]).toEqual({ id: 'model-b', name: 'model-b' });
  });

  it('preserves baseUrlOverride and capability flags on existing models', () => {
    const fetched: FetchedModel[] = [{ id: 'model-x', object: 'model' }];
    const existing: ModelConfig[] = [
      {
        id: 'model-x',
        name: 'Model X',
        baseUrlOverride: 'https://custom.api.com/v1',
        supportsVision: true,
        supportsReasoning: false,
      },
    ];

    const result = mergeFetchedModels(fetched, existing);

    expect(result[0].baseUrlOverride).toBe('https://custom.api.com/v1');
    expect(result[0].supportsVision).toBe(true);
    expect(result[0].supportsReasoning).toBe(false);
  });

  it('keeps existing models not present in fetched list', () => {
    const fetched: FetchedModel[] = [{ id: 'model-a', object: 'model' }];
    const existing: ModelConfig[] = [
      { id: 'model-a', name: 'Model A' },
      { id: 'model-offline', name: 'Offline Model' },
    ];

    const result = mergeFetchedModels(fetched, existing);

    expect(result).toHaveLength(2);
    expect(result.find((m) => m.id === 'model-offline')).toEqual({ id: 'model-offline', name: 'Offline Model' });
  });

  it('returns existing unchanged when fetched is empty', () => {
    const existing: ModelConfig[] = [
      { id: 'model-a', name: 'Model A' },
      { id: 'model-b', name: 'Model B' },
    ];

    const result = mergeFetchedModels([], existing);

    expect(result).toEqual(existing);
  });

  it('maps fetched to ModelConfig when existing is empty', () => {
    const fetched: FetchedModel[] = [
      { id: 'model-a', object: 'model' },
      { id: 'model-b', object: 'model', owned_by: 'org' },
    ];

    const result = mergeFetchedModels(fetched, []);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'model-a', name: 'model-a' });
    expect(result[1]).toEqual({ id: 'model-b', name: 'model-b' });
  });

  it('does not produce duplicate ids from fetched list', () => {
    const fetched: FetchedModel[] = [
      { id: 'model-a', object: 'model' },
      { id: 'model-a', object: 'model' },
    ];
    const existing: ModelConfig[] = [];

    const result = mergeFetchedModels(fetched, existing);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: 'model-a', name: 'model-a' });
  });
});
