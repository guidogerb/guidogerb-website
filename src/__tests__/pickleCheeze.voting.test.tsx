import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import PickleCheezePage from '../websites/pickleCheeze/PickleCheezePage';

// Mock aws-amplify so VoteButtons can import it dynamically
const graphqlMock = vi.fn(async (args: any) => {
  const q: string = args?.query || '';
  if (q.includes('GetVote')) {
    // start with no record
    return { data: { getVote: null } } as any;
  }
  if (q.includes('CreateVote')) {
    const up = args?.variables?.input?.up ?? 0;
    const down = args?.variables?.input?.down ?? 0;
    return { data: { createVote: { id: 'x', up, down } } } as any;
  }
  if (q.includes('UpdateVote')) {
    const up = args?.variables?.input?.up ?? 0;
    const down = args?.variables?.input?.down ?? 0;
    return { data: { updateVote: { id: 'x', up, down } } } as any;
  }
  return { data: {} } as any;
});

vi.mock('aws-amplify', () => ({
  API: { graphql: (...args: any[]) => graphqlMock(...args) },
}));

beforeEach(() => {
  graphqlMock.mockClear();
});

describe('PickleCheeze voting interactions', () => {
  it('upvote highlights up and increments count; switching to down flips counts and active state', async () => {
    render(<PickleCheezePage />);

    // Wait for initial counts fetch to complete on first visible track
    // Find first vote control group under a track item
    const upBtn = await screen.findAllByTitle(/upvote/i).then(list => list[0] as HTMLButtonElement);
    // The down button is a sibling; locate via title
    const trackAnchor = upBtn.closest('a');
    expect(trackAnchor).toBeTruthy();
    const downBtn = within(trackAnchor as HTMLElement).getByTitle(/downvote/i) as HTMLButtonElement;

    // Initially both counts should be 0
    const upCountEl = within(upBtn).getByText('0');
    const downCountEl = within(downBtn).getByText('0');
    expect(upCountEl).toBeInTheDocument();
    expect(downCountEl).toBeInTheDocument();

    // Click up: should increment to 1 and add active class
    fireEvent.click(upBtn);
    await waitFor(() => {
      expect(within(upBtn).getByText('1')).toBeInTheDocument();
      expect(upBtn.className).toMatch(/active/);
      expect(within(downBtn).getByText('0')).toBeInTheDocument();
      expect(downBtn.className).not.toMatch(/active/);
    });

    // Click down: should decrement up to 0, increment down to 1, active moves
    fireEvent.click(downBtn);
    await waitFor(() => {
      expect(within(upBtn).getByText('0')).toBeInTheDocument();
      expect(upBtn.className).not.toMatch(/active/);
      expect(within(downBtn).getByText('1')).toBeInTheDocument();
      expect(downBtn.className).toMatch(/active/);
    });
  });

  it('toggling the same vote off returns count to 0 and removes active class (upvote)', async () => {
    render(<PickleCheezePage />);
    const upBtn = (await screen.findAllByTitle(/upvote/i))[0] as HTMLButtonElement;

    // Activate up
    fireEvent.click(upBtn);
    await waitFor(() => {
      const countEl = upBtn.querySelector('.vote-count') as HTMLElement;
      expect(countEl?.textContent).toBe('1');
      expect(upBtn.className).toMatch(/active/);
    });

    // Toggle up off
    fireEvent.click(upBtn);
    await waitFor(() => {
      const countEl = upBtn.querySelector('.vote-count') as HTMLElement;
      expect(countEl?.textContent).toBe('0');
      expect(upBtn.className).not.toMatch(/active/);
    });
  });
});
