import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  isTerminalStatus,
  isTransitionAllowed,
  type AppointmentStatus,
} from '../src/appointments/status-machine';

describe('status-machine', () => {
  describe('isTerminalStatus', () => {
    const terminals: AppointmentStatus[] = ['completed', 'cancelled', 'no_show'];
    const nonTerminals: AppointmentStatus[] = ['requested', 'scheduled', 'confirmed'];

    for (const s of terminals) {
      it(`treats '${s}' as terminal`, () => {
        assert.equal(isTerminalStatus(s), true);
      });
    }
    for (const s of nonTerminals) {
      it(`treats '${s}' as non-terminal`, () => {
        assert.equal(isTerminalStatus(s), false);
      });
    }
  });

  describe('isTransitionAllowed', () => {
    it('allows requested -> confirmed', () => {
      assert.equal(isTransitionAllowed('requested', 'confirmed'), true);
    });
    it('allows requested -> cancelled', () => {
      assert.equal(isTransitionAllowed('requested', 'cancelled'), true);
    });
    it('rejects requested -> completed', () => {
      assert.equal(isTransitionAllowed('requested', 'completed'), false);
    });

    it('allows scheduled -> confirmed/completed/cancelled/no_show', () => {
      for (const next of [
        'confirmed',
        'completed',
        'cancelled',
        'no_show',
      ] as AppointmentStatus[]) {
        assert.equal(
          isTransitionAllowed('scheduled', next),
          true,
          `scheduled -> ${next}`,
        );
      }
    });

    it('allows confirmed -> completed/cancelled/no_show', () => {
      for (const next of [
        'completed',
        'cancelled',
        'no_show',
      ] as AppointmentStatus[]) {
        assert.equal(
          isTransitionAllowed('confirmed', next),
          true,
          `confirmed -> ${next}`,
        );
      }
    });

    it('rejects all transitions out of terminal states (except no-op)', () => {
      const allTargets: AppointmentStatus[] = [
        'requested',
        'scheduled',
        'confirmed',
        'completed',
        'cancelled',
        'no_show',
      ];
      for (const from of ['completed', 'cancelled', 'no_show'] as AppointmentStatus[]) {
        for (const to of allTargets) {
          if (from === to) continue;
          assert.equal(
            isTransitionAllowed(from, to),
            false,
            `${from} -> ${to} should be forbidden`,
          );
        }
      }
    });

    it('treats same-state as a no-op (allowed)', () => {
      assert.equal(isTransitionAllowed('confirmed', 'confirmed'), true);
    });
  });
});
