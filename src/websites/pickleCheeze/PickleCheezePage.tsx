import React, { useMemo, useState } from 'react';
import SearchInput from '../../components/SearchInput';
import AudioPlayer, { Track } from '../../components/AudioPlayer';
import VoteButtons from '../../components/VoteButtons';

// Base URL where assets are hosted via CloudFront + S3
const ASSETS_BASE = 'https://assets.guidogerbpublishing.com/PickleCheeze/';

export type PCTrack = { name: string; path: string };
export type PCFolder = { name: string; tracks?: PCTrack[]; folders?: PCFolder[] };

// Minimal subset of folders/tracks from the static HTML, can be extended easily
const data: PCFolder = {
  name: 'PickleCheeze Music Library • 57 tracks',
  folders: [
    { name: 'Frodo1 • 2 tracks', tracks: [
      { name: 'Frodo1Remix2.mp3', path: 'Frodo1/Frodo1Remix2.mp3' },
      { name: 'Frodo1Remix.mp3', path: 'Frodo1/Frodo1Remix.mp3' },
    ]},
    { name: 'Frodo2 • 4 tracks', tracks: [
      { name: 'Frodo2Fusion2.mp3', path: 'Frodo2/Frodo2Fusion2.mp3' },
      { name: 'Frodo2Fusion.mp3', path: 'Frodo2/Frodo2Fusion.mp3' },
      { name: 'Frodo2Remix2.mp3', path: 'Frodo2/Frodo2Remix2.mp3' },
      { name: 'Frodo2Remix.mp3', path: 'Frodo2/Frodo2Remix.mp3' },
    ]},
    { name: 'FroGuy • 3 tracks', tracks: [
      { name: 'FroGuyFusion2.mp3', path: 'FroGuy/FroGuyFusion2.mp3' },
      { name: 'FroGuyFusion.mp3', path: 'FroGuy/FroGuyFusion.mp3' },
      { name: 'FroGuyRemix.mp3', path: 'FroGuy/FroGuyRemix.mp3' },
    ]},
    { name: 'Highway101 • 1 track', tracks: [
      { name: 'highway101.mp3', path: 'Highway101/highway101.mp3' },
    ]},
    { name: 'Hittio • 4 tracks', tracks: [
      { name: 'Hittio.mp3', path: 'Hittio/Hittio.mp3' },
      { name: 'HittioV2.mp3', path: 'Hittio/HittioV2.mp3' },
      { name: 'HittioV3.mp3', path: 'Hittio/HittioV3.mp3' },
      { name: 'HittioV4.mp3', path: 'Hittio/HittioV4.mp3' },
    ]},
  ]
};

function flattenTracks(folder: PCFolder): Track[] {
  const list: Track[] = [];
  const walk = (f: PCFolder) => {
    if (f.tracks) {
      for (const t of f.tracks) {
        list.push({ url: ASSETS_BASE + t.path, name: t.name });
      }
    }
    if (f.folders) f.folders.forEach(walk);
  };
  walk(folder);
  return list;
}

function FolderView({ folder, query }: { folder: PCFolder; query: string }) {
  const q = query.trim().toLowerCase();
  const matches = (s: string) => s.toLowerCase().includes(q);

  // Determine visibility per track
  const tracks = (folder.tracks ?? []).filter(t => !q || matches(t.name));
  const subfolders = (folder.folders ?? []);

  const subViews = subfolders
    .map(f => <FolderView key={f.name} folder={f} query={query} />)
    .filter(Boolean);

  const anyVisible = tracks.length > 0 || subViews.length > 0 || (!q || matches(folder.name));
  if (!anyVisible) return null;

  return (
    <details className="folder">
      <summary>
        <span className="folder-icon">📁</span>
        <span className="folder-name">{folder.name}</span>
      </summary>
      <div className="folder-body">
        {tracks.length > 0 && (
          <ul className="track-list" style={{ listStyle: 'none', padding: 0 }}>
            {tracks.map((t) => {
              const id = t.path; // use relative path as id
              const url = ASSETS_BASE + t.path;
              return (
                <li className="track" key={url}>
                  <a className="track-link" href={url} target="_blank" title={`Play ${t.name}`}
                     onClick={(e) => { e.preventDefault(); const audioEl = document.querySelector('audio'); if (audioEl) { (audioEl as HTMLAudioElement).src = url; (audioEl as HTMLAudioElement).play().catch(()=>{}); }}}>
                    <span className="track-icon">🎵</span>
                    <span className="track-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                    <VoteButtons id={id} />
                  </a>
                </li>
              );
            })}
          </ul>
        )}
        {subViews}
      </div>
    </details>
  );
}

export default function PickleCheezePage() {
  const [q, setQ] = useState('');
  const allTracks = useMemo(() => flattenTracks(data), []);
  const filteredTracks = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return allTracks;
    return allTracks.filter(t => t.name.toLowerCase().includes(s) || t.url.toLowerCase().includes(s));
  }, [q, allTracks]);

  return (
    <div className="container" style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
        <div className="title" style={{ fontWeight: 700, fontSize: 28 }}>PickleCheeze Music Library</div>
        <div className="meta" style={{ color: '#9aa4b2', fontSize: 14 }}>assets hosted at assets.guidogerbpublishing.com</div>
      </header>

      <SearchInput value={q} onChange={setQ} />

      <AudioPlayer tracks={filteredTracks} />

      <details className="folder" open>
        <summary>
          <span className="folder-icon">📁</span>
          <span className="folder-name">{data.name}</span>
        </summary>
        <div className="folder-body">
          {(data.folders ?? []).map(f => (
            <FolderView key={f.name} folder={f} query={q} />
          ))}
        </div>
      </details>
    </div>
  );
}
