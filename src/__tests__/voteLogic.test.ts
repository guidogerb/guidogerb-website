import { describe, it, expect } from 'vitest';
import { initialState, reduceVote } from '../services/voteLogic';

describe('voteLogic', () => {
  it('increments up and highlights up when clicking up first', () => {
    const s1 = reduceVote(initialState, 'up');
    expect(s1.isUp).toBe(true);
    expect(s1.isDown).toBe(false);
    expect(s1.counts).toEqual({ up: 1, down: 0 });
  });

  it('mutually excludes: clicking down after up decrements up and increments down', () => {
    const s1 = reduceVote(initialState, 'up');
    const s2 = reduceVote(s1, 'down');
    expect(s2.isUp).toBe(false);
    expect(s2.isDown).toBe(true);
    expect(s2.counts).toEqual({ up: 0, down: 1 });
  });

  it('toggle off up if already active', () => {
    const s1 = reduceVote(initialState, 'up');
    const s2 = reduceVote(s1, 'toggleUp');
    expect(s2.isUp).toBe(false);
    expect(s2.counts).toEqual({ up: 0, down: 0 });
  });

  it('never goes negative and toggling twice re-activates to 1', () => {
    const s1 = reduceVote(initialState, 'down'); // {0,1}
    expect(s1.counts.down).toBeGreaterThanOrEqual(0);
    const s2 = reduceVote(s1, 'toggleDown'); // to 0
    expect(s2.counts.down).toBe(0);
    const s3 = reduceVote(s2, 'toggleDown'); // back to 1
    expect(s3.counts.down).toBe(1);
  });
});
