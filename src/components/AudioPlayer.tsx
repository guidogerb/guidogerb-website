import React, { useEffect, useMemo, useRef, useState } from 'react';

export type Track = { url: string; name: string };

export function AudioPlayer({ tracks }: { tracks: Track[] }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [current, setCurrent] = useState<number>(-1);
  const [now, setNow] = useState<string>('No track selected');

  const hasTracks = tracks.length > 0;

  const shuffle = (arr: Track[]) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const buildShuffled = () => {
    const p = shuffle(tracks);
    setPlaylist(p);
    setCurrent(-1);
  };

  const load = (index: number) => {
    if (index < 0 || index >= playlist.length) return;
    setCurrent(index);
    const t = playlist[index];
    if (audioRef.current) {
      audioRef.current.src = t.url;
    }
    setNow(`Now playing: ${t.name}`);
  };

  const playIndex = (index: number) => {
    load(index);
    audioRef.current?.play().catch(() => {/* ignore autoplay policy */});
  };

  const next = () => {
    if (current < playlist.length - 1) {
      playIndex(current + 1);
    } else {
      buildShuffled();
      setTimeout(() => playIndex(0), 0);
    }
  };

  const prev = () => {
    if (current > 0) playIndex(current - 1);
  };

  useEffect(() => {
    buildShuffled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks.map(t => t.url).join('|')]);

  useEffect(() => {
    setNow(hasTracks ? `Ready: ${tracks.length} tracks (Shuffle Play ▶ to start)` : 'No tracks found');
  }, [hasTracks, tracks.length]);

  return (
    <div className="player" style={{ margin: '12px 0 8px', padding: 12 }}>
      <div className="player-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <button className="btn" onClick={() => { buildShuffled(); playIndex(0); }} disabled={!hasTracks} title="Shuffle all and play">Shuffle Play ▶</button>
        <button className="btn" onClick={prev} disabled={!hasTracks || current <= 0} title="Previous track">⏮ Prev</button>
        <button className="btn" onClick={next} disabled={!hasTracks} title="Next track">⏭ Next</button>
        <button className="btn" onClick={() => { const p = playlist.length; buildShuffled(); if (p) playIndex(0); }} disabled={!hasTracks} title="Reshuffle">🔀 Reshuffle</button>
        <div className="now-playing" style={{ flex: '1 1 auto', minWidth: 200, color: '#9aa4b2' }}>{now}</div>
      </div>
      <audio ref={audioRef} controls preload="none" onEnded={next} style={{ width: '100%', maxWidth: 520 }} />
    </div>
  );
}

export default AudioPlayer;
