import indiaStateDataset from './stateCities.js';
import blockCityDistricts from './blockCity.js';
import { INDIA_STATE_LABEL_TO_LGD_CODE } from './indiaStateToLgdCode';

export type BlockCityDistrict = {
  name: string;
  code: string;
  stateCode: string;
  blockList: { name: string; code: string }[];
};

const blockCity = blockCityDistricts as BlockCityDistrict[];

const dataset = indiaStateDataset as Record<string, string[]>;

/** State names aligned with picker order (popular / alpha). */
export function getIndianStates(): string[] {
  return Object.keys(dataset).sort((a, b) => a.localeCompare(b));
}

/** “City” list from your urban-agglomeration style dataset — for quick reference / future matching. */
export function getUrbanCitiesForState(state: string): string[] {
  return dataset[state] ?? [];
}

export function resolveStateLgdCode(stateLabel: string): string | undefined {
  return INDIA_STATE_LABEL_TO_LGD_CODE[stateLabel.trim()];
}

export function getDistrictsForState(state: string): string[] {
  const code = resolveStateLgdCode(state);
  if (!code) return [];
  return blockCity.filter((r) => r.stateCode === code).map((r) => r.name).sort((a, b) => a.localeCompare(b));
}

export function getBlocksForStateAndDistrict(state: string, district: string): string[] {
  const code = resolveStateLgdCode(state);
  if (!code || !district) return [];
  const row = blockCity.find((r) => r.stateCode === code && r.name === district);
  return (row?.blockList ?? []).map((b) => b.name).sort((a, b) => a.localeCompare(b));
}
