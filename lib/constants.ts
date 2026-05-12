export const FACTORS = {
  1: 100,
  2: 10,
  3: 4,
  4: 1,
} as const;

export type MachineType = keyof typeof FACTORS;

export function calculateAmount(diff: number, type: MachineType): number {
  return diff / FACTORS[type];
}
