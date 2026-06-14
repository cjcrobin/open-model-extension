import { ModelConfig, FetchedModel } from '../types';

export function mergeFetchedModels(
  fetched: FetchedModel[],
  existing: ModelConfig[],
): ModelConfig[] {
  const existingMap = new Map(existing.map((m) => [m.id, m]));
  const seenIds = new Set<string>();
  const merged: ModelConfig[] = [];

  for (const fm of fetched) {
    if (seenIds.has(fm.id)) {
      continue;
    }
    seenIds.add(fm.id);

    if (existingMap.has(fm.id)) {
      merged.push(existingMap.get(fm.id)!);
    } else {
      merged.push({ id: fm.id, name: fm.id });
    }
  }

  for (const em of existing) {
    if (!seenIds.has(em.id)) {
      merged.push(em);
    }
  }

  return merged;
}
