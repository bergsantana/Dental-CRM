export type AppointmentStatus =
  | 'requested'
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

const TRANSITIONS: Record<AppointmentStatus, ReadonlyArray<AppointmentStatus>> = {
  requested: ['confirmed', 'cancelled'],
  scheduled: ['confirmed', 'completed', 'cancelled', 'no_show'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function isTerminalStatus(s: AppointmentStatus): boolean {
  return TRANSITIONS[s].length === 0;
}

export function isTransitionAllowed(
  prev: AppointmentStatus,
  next: AppointmentStatus,
): boolean {
  if (prev === next) return true;
  return TRANSITIONS[prev].includes(next);
}
