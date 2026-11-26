import { generalProfileAPI, landingArtistAPI } from '../services/api';

/** Extract a Nano username from free text, @handle, or profile URL. */
export function extractNanoUsername(raw) {
  if (!raw) return '';
  const text = String(raw).trim();
  const linkMatch = text.match(/\/(?:link|artist|a|founder|company|restaurant)\/([a-zA-Z0-9_.-]+)/i);
  const value = linkMatch && linkMatch[1] ? linkMatch[1] : text.replace(/^@+/, '').trim();
  return value.toLowerCase();
}

/** Public path for a Nano profile by type. */
export function nanoProfilePath(usernameOrUrl, profileType) {
  const username = extractNanoUsername(usernameOrUrl);
  if (!username) return '';
  const t = String(profileType || '').toLowerCase();
  if (t === 'company') return `/company/${username}`;
  if (t === 'founder') return `/founder/${username}`;
  if (t === 'artist') return `/artist/${username}`;
  if (t === 'restaurant') return `/restaurant/${username}`;
  return `/link/${username}`;
}

/** Profile name is stored as FIRST|LAST — show "First Last" on Team cards. */
function formatProfileName(name) {
  return String(name || '')
    .split('|')
    .map((p) => p.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** First specialization badge (e.g. "Co-founder"), not the About tagline. */
function firstSpecializationTag(specialization) {
  if (!specialization) return '';
  return String(specialization)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)[0] || '';
}

function mapGeneralData(d, fallbackUsername) {
  const type = d.profileType || 'general';
  const username = (d.username || fallbackUsername).toLowerCase();
  const personName = formatProfileName(d.name);
  const companyName = (d.companyName || '').trim();
  // People: first + last name. Companies: company name.
  const displayName = type === 'company'
    ? (companyName || personName || `@${username}`)
    : (personName || companyName || `@${username}`);
  const firstTag = firstSpecializationTag(d.specialization);
  return {
    name: displayName,
    role:
      firstTag ||
      (type === 'founder' ? 'Founder' : type === 'company' ? 'Company' : type === 'artist' ? 'Artist' : 'Team Member'),
    photo: d.photo || d.companyImage || '',
    companyName,
    companyImage: d.companyImage || '',
    foundingYear: d.foundingYear || '',
    profileType: type,
    username,
    artistId: type === 'artist' ? username : undefined
  };
}

function mapArtistData(a, fallbackUsername) {
  const id = (a.artistId || fallbackUsername).toLowerCase();
  const firstTag = firstSpecializationTag(a.specialization);
  return {
    name: formatProfileName(a.name) || `@${id}`,
    role: firstTag || 'Artist',
    photo: a.photo || '',
    profileType: 'artist',
    username: id,
    artistId: id
  };
}

async function fetchGeneral(username) {
  const res = await generalProfileAPI.getByUsername(username);
  return res && res.data ? mapGeneralData(res.data, username) : null;
}

async function fetchArtist(username) {
  const res = await landingArtistAPI.getPublicProfile(username);
  return res && res.data ? mapArtistData(res.data, username) : null;
}

/**
 * Live-resolve a Nano profile.
 * hintType 'artist' → artist API first (avoids general-profile 404s for artists).
 */
export async function resolveNanoProfile(usernameOrUrl, hintType) {
  const username = extractNanoUsername(usernameOrUrl);
  if (!username) return null;

  const preferArtist = hintType === 'artist';
  const primary = preferArtist ? fetchArtist : fetchGeneral;
  const secondary = preferArtist ? fetchGeneral : fetchArtist;

  try {
    const hit = await primary(username);
    if (hit) return hit;
  } catch (_) {
    /* try secondary */
  }

  try {
    const hit = await secondary(username);
    if (hit) return hit;
  } catch (_) {
    /* not found */
  }

  return null;
}

/** Merge stored team stub with live fields (fallback to stub). */
export function mergeLiveTeamMember(stored, live) {
  const username = extractNanoUsername(
    live?.username || stored?.nanoUsername || stored?.username || stored?.artistId || ''
  );
  if (!live) {
    return {
      ...stored,
      name: (stored?.name || '').replace(/\|/g, ' ').trim() || (username ? `@${username}` : 'Team Member'),
      role: (stored?.role || 'Team Member').replace(/\|/g, ' ').trim(),
      photo: stored?.photo || '',
      nanoUsername: username,
      username,
      profileType: stored?.profileType || (stored?.artistId ? 'artist' : 'general')
    };
  }
  return {
    ...stored,
    name: live.name,
    role: live.role,
    photo: live.photo,
    nanoUsername: live.username || username,
    username: live.username || username,
    artistId: live.profileType === 'artist' ? live.username || username : stored?.artistId,
    profileType: live.profileType
  };
}
