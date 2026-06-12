import { describe, it, expect } from 'vitest';
import { FetchedModel, ModelsApiResponse } from '../types';

describe('FetchedModel', () => {
  it('can be created with only id and object', () => {
    const model: FetchedModel = { id: 'gpt-4', object: 'model' };
    expect(model.id).toBe('gpt-4');
    expect(model.object).toBe('model');
    expect(model.owned_by).toBeUndefined();
  });

  it('supports optional owned_by field', () => {
    const model: FetchedModel = { id: 'gpt-4', object: 'model', owned_by: 'openai' };
    expect(model.owned_by).toBe('openai');
  });
});

describe('ModelsApiResponse', () => {
  it('contains a data array of FetchedModel', () => {
    const response: ModelsApiResponse = {
      object: 'list',
      data: [
        { id: 'model-a', object: 'model' },
        { id: 'model-b', object: 'model', owned_by: 'org' },
      ],
    };
    expect(response.object).toBe('list');
    expect(response.data).toHaveLength(2);
    expect(response.data[0].id).toBe('model-a');
    expect(response.data[1].owned_by).toBe('org');
  });

  it('supports an empty data array', () => {
    const response: ModelsApiResponse = { object: 'list', data: [] };
    expect(response.data).toHaveLength(0);
  });
});
