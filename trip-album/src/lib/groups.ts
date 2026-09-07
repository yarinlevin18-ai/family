import { hamming } from "./hash";
import type { Photo } from "./types";

/** How many differing bits still counts as "the same shot". */
export const NEAR_THRESHOLD = 8;

export type FileMeta = { bytes: number | null; etag: string | null };

export type Group = {
  key: string;
  photos: Photo[];
  /** True when every member is byte-for-byte identical. */
  exact: boolean;
};

class UnionFind {
  private parent = new Map<string, string>();
  find(x: string): string {
    const p = this.parent.get(x);
    if (p === undefined) {
      this.parent.set(x, x);
      return x;
    }
    if (p === x) return x;
    const root = this.find(p);
    this.parent.set(x, root);
    return root;
  }
  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

/**
 * Group photos that are the same shot: identical file contents (via the storage
 * checksum, no download needed) or near-identical images (via perceptual hash).
 */
export function buildGroups(photos: Photo[], files: Map<string, FileMeta>): Group[] {
  const uf = new UnionFind();
  photos.forEach((p) => uf.find(p.id));

  // 1. Byte-identical files share a checksum and a size.
  const byChecksum = new Map<string, string[]>();
  for (const p of photos) {
    const meta = files.get(p.id);
    if (!meta?.etag || !meta.bytes) continue;
    const key = `${meta.etag}:${meta.bytes}`;
    const list = byChecksum.get(key);
    if (list) list.push(p.id);
    else byChecksum.set(key, [p.id]);
  }
  const exactIds = new Set<string>();
  for (const ids of byChecksum.values()) {
    if (ids.length < 2) continue;
    ids.forEach((id) => exactIds.add(id));
    for (let i = 1; i < ids.length; i++) uf.union(ids[0], ids[i]);
  }

  // 2. Visually near-identical images.
  const hashed = photos.filter((p) => p.phash?.length === 16);
  for (let i = 0; i < hashed.length; i++) {
    for (let j = i + 1; j < hashed.length; j++) {
      if (hamming(hashed[i].phash!, hashed[j].phash!) <= NEAR_THRESHOLD) {
        uf.union(hashed[i].id, hashed[j].id);
      }
    }
  }

  const buckets = new Map<string, Photo[]>();
  for (const p of photos) {
    const root = uf.find(p.id);
    const list = buckets.get(root);
    if (list) list.push(p);
    else buckets.set(root, [p]);
  }

  return [...buckets.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([key, list]) => ({
      key,
      photos: [...list].sort((a, b) => a.created_at.localeCompare(b.created_at)),
      exact: list.every((p) => exactIds.has(p.id)),
    }))
    .sort((a, b) => b.photos.length - a.photos.length);
}

/** The photo that stands for a group: the explicit pick, else a favorite, else the newest. */
export function representative(group: Group): Photo {
  return (
    group.photos.find((p) => p.is_pick) ??
    group.photos.find((p) => p.is_favorite) ??
    group.photos[group.photos.length - 1]
  );
}

/** Collapse duplicate groups down to one card each, keeping the original order. */
export function collapse(photos: Photo[], groups: Group[]) {
  const keep = new Map<string, Group>();
  const hidden = new Set<string>();
  for (const g of groups) {
    const rep = representative(g);
    keep.set(rep.id, g);
    g.photos.forEach((p) => {
      if (p.id !== rep.id) hidden.add(p.id);
    });
  }
  return {
    photos: photos.filter((p) => !hidden.has(p.id)),
    groupOf: (id: string) => keep.get(id),
  };
}
