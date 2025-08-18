
export type Site = {
  key: string;
  name: string;
  path: string;
  description?: string;
};

const defaultSites: Site[] = [
  {
    key: 'pickle-cheeze',
    name: 'PickleCheeze',
    path: '/pickle-cheeze',
    description: 'Music library with shuffle player and global voting',
  },
];

export default function SitesList({ sites = defaultSites }: { sites?: Site[] }) {
  return (
    <div className="container" style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
        <div className="title" style={{ fontWeight: 700, fontSize: 28 }}>Available Sites</div>
        <div className="meta" style={{ color: '#9aa4b2', fontSize: 14 }}>Choose a site to explore</div>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {sites.map((s) => (
          <a key={s.key} href={s.path} className="track-link" style={{ display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="track-icon">🎵</span>
              <div style={{ overflow: 'hidden' }}>
                <div className="track-name" style={{ fontWeight: 700 }}>{s.name}</div>
                {s.description ? (
                  <div style={{ color: '#9aa4b2', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description}</div>
                ) : null}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
