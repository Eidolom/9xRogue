export const FLOOR_NAMES: Record<number, string> = {
  1: 'The Basics',
  2: 'The Scanner',
  3: 'The Intersection',
  4: 'The Twins',
  5: 'The Triad',
  6: 'The Gatekeeper',
  7: 'The Hinge',
  8: 'The Net',
  9: 'The Final Exam',
};

export function getFloorName(floor: number): string {
  return FLOOR_NAMES[floor] || 'Unknown Floor';
}
