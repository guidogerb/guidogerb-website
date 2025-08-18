export type Counts = { up: number; down: number };
export type State = { isUp: boolean; isDown: boolean; counts: Counts };
export type Action = 'up' | 'down' | 'toggleUp' | 'toggleDown';

/**
 * Pure vote state transition, mirroring the logic on the static PickleCheeze page.
 * - Clicking up when not active: isUp=true, increments up; if down was active, down becomes inactive and decrements (min 0)
 * - Clicking up when active: toggles off and decrements up (min 0)
 * - Clicking down is symmetric.
 */
export function reduceVote(prev: State, action: Action): State {
  let { isUp, isDown, counts } = prev;
  counts = { ...counts };
  if (action === 'up' || action === 'toggleUp') {
    if (!isUp) {
      isUp = true;
      if (isDown && counts.down > 0) counts.down -= 1;
      isDown = false;
      counts.up += 1;
    } else {
      isUp = false;
      if (counts.up > 0) counts.up -= 1;
    }
  } else if (action === 'down' || action === 'toggleDown') {
    if (!isDown) {
      isDown = true;
      if (isUp && counts.up > 0) counts.up -= 1;
      isUp = false;
      counts.down += 1;
    } else {
      isDown = false;
      if (counts.down > 0) counts.down -= 1;
    }
  }
  return { isUp, isDown, counts };
}

export const initialState: State = { isUp: false, isDown: false, counts: { up: 0, down: 0 } };
