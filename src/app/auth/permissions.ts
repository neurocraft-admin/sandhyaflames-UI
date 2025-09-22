export const Perm = {
  View: 1,
  Create: 2,
  Edit: 4,
  Delete: 8,
  All: 16,
} as const;

export function hasPerm(mask: number, need: number): boolean {
  return (mask & Perm.All) === Perm.All || (mask & need) === need;
}
