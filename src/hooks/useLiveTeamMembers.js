import { useEffect, useRef, useState } from 'react';
import {
  extractNanoUsername,
  mergeLiveTeamMember,
  resolveNanoProfile
} from '../utils/resolveNanoProfile';

/**
 * Refresh Leadership/Team cards from each member's live Nano profile
 * (name, role, photo) while keeping username stubs as the source of truth.
 */
export default function useLiveTeamMembers(coFounders) {
  const list = Array.isArray(coFounders) ? coFounders : [];
  const signature = list
    .map((cf) =>
      extractNanoUsername(cf?.nanoUsername || cf?.username || cf?.artistId || cf?.handle || '')
    )
    .join('|');

  const listRef = useRef(list);
  listRef.current = list;

  const [liveList, setLiveList] = useState(() => list.map((cf) => mergeLiveTeamMember(cf, null)));

  useEffect(() => {
    let cancelled = false;
    const current = listRef.current;

    setLiveList(current.map((cf) => mergeLiveTeamMember(cf, null)));

    (async () => {
      const resolved = await Promise.all(
        current.map(async (cf) => {
          const uname = extractNanoUsername(
            cf?.nanoUsername || cf?.username || cf?.artistId || cf?.handle || ''
          );
          if (!uname) return mergeLiveTeamMember(cf, null);
          const looksArtist =
            cf?.profileType === 'artist' ||
            Boolean(cf?.artistId) ||
            /\/nfc\/artists\//i.test(cf?.photo || '');
          const hint = looksArtist ? 'artist' : cf?.profileType;
          const live = await resolveNanoProfile(uname, hint);
          return mergeLiveTeamMember(cf, live);
        })
      );
      if (!cancelled) setLiveList(resolved);
    })();

    return () => {
      cancelled = true;
    };
  }, [signature]);

  return liveList;
}
