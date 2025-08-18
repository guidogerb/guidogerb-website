import { useEffect, useState } from 'react';
import { initialState, reduceVote, State } from '../services/voteLogic';
import type { Counts } from '../services/voteLogic';

// Lightweight GraphQL calls via Amplify API if available
async function gql<T = any>(query: string, variables: Record<string, any>) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = await import('aws-amplify');
    const API: any = (mod as any).API;
    if (!API || !API.graphql) throw new Error('Amplify API not available');
    const res = await API.graphql({ query, variables, authMode: 'iam' });
    return res as T;
  } catch (e) {
    console.warn('[VoteButtons] GraphQL unavailable', e);
    throw e;
  }
}

async function fetchCounts(id: string): Promise<Counts> {
  const query = /* GraphQL */ `query GetVote($id: ID!) { getVote(id: $id) { id up down } }`;
  try {
    const res: any = await gql(query, { id });
    const vote = res?.data?.getVote;
    return vote ? { up: vote.up, down: vote.down } : { up: 0, down: 0 };
  } catch {
    return { up: 0, down: 0 };
  }
}

async function persistCounts(id: string, up: number, down: number) {
  const getQ = /* GraphQL */ `query GetVote($id: ID!) { getVote(id: $id) { id } }`;
  const createM = /* GraphQL */ `mutation CreateVote($input: CreateVoteInput!) { createVote(input: $input) { id up down } }`;
  const updateM = /* GraphQL */ `mutation UpdateVote($input: UpdateVoteInput!) { updateVote(input: $input) { id up down } }`;
  try {
    const res: any = await gql(getQ, { id });
    if (res?.data?.getVote) {
      await gql(updateM, { input: { id, up, down } });
    } else {
      await gql(createM, { input: { id, up, down } });
    }
  } catch (e) {
    console.warn('[VoteButtons] persistCounts failed', e);
  }
}

export function VoteButtons({ id }: { id: string }) {
  const [state, setState] = useState<State>(initialState);

  useEffect(() => {
    let mounted = true;
    fetchCounts(id).then((counts) => {
      if (mounted) setState((s) => ({ ...s, counts }));
    });
    return () => {
      mounted = false;
    };
  }, [id]);

  const up = () => {
    setState((prev) => {
      const next = reduceVote(prev, 'up');
      persistCounts(id, next.counts.up, next.counts.down);
      return next;
    });
  };
  const down = () => {
    setState((prev) => {
      const next = reduceVote(prev, 'down');
      persistCounts(id, next.counts.up, next.counts.down);
      return next;
    });
  };

  return (
    <span className="votes" style={{ display: 'inline-flex', gap: 6, marginLeft: 8 }}>
      <button
        className={`vote-btn up${state.isUp ? ' active' : ''}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); up(); }}
        title="Upvote"
      >
        <span role="img" aria-label="thumbs up">👍</span>
        <span className="vote-count" style={{ minWidth: '1.5em', textAlign: 'right' }}>{state.counts.up}</span>
      </button>
      <button
        className={`vote-btn down${state.isDown ? ' active' : ''}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); down(); }}
        title="Downvote"
      >
        <span role="img" aria-label="thumbs down">👎</span>
        <span className="vote-count" style={{ minWidth: '1.5em', textAlign: 'right' }}>{state.counts.down}</span>
      </button>
    </span>
  );
}

export default VoteButtons;
