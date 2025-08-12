import React, { useState } from 'react';
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

export type ProfileSetupProps = {
  userId: string;
  defaultRole: Schema["UserProfile"]["type"]["role"]; // role derived from Cognito groups
  onSaved: (profile: Schema["UserProfile"]["type"]) => void;
};

export default function ProfileSetup({ userId, defaultRole, onSaved }: ProfileSetupProps) {
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await client.models.UserProfile.create({
        id: userId,
        displayName,
        role: defaultRole,
        avatarUrl: avatarUrl || undefined,
        bio: bio || undefined,
        socialLinks: website ? { website } : undefined,
      });
      if (result && 'data' in result && result.data) {
        onSaved(result.data);
      } else if ((result as any)?.id) {
        onSaved(result as any);
      } else {
        throw new Error('Unexpected create result');
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '2rem auto', padding: '1rem' }}>
      <h2>Complete your profile</h2>
      <p>Welcome! Please set a display name and optional profile details.</p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Display name*
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              style={{ display: 'block', width: '100%', padding: 8 }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Avatar URL
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              style={{ display: 'block', width: '100%', padding: 8 }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              style={{ display: 'block', width: '100%', padding: 8 }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Website
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://your-site.com"
              style={{ display: 'block', width: '100%', padding: 8 }}
            />
          </label>
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>Error: {error}</div>}
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}
