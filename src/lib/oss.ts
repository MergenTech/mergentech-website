import settings from '../content/oss.json';
import cache from '../content/oss-cache.json';

export type OssItem = { number: number; title: string; state: 'merged' | 'open' };
export type OssData = { items: OssItem[]; merged: number; total: number; url: string };

let memo: Promise<OssData> | undefined;

/**
 * Haalt tijdens de build de pull requests op bij GitHub.
 * Lukt dat niet, dan gebruiken we de laatst bewaarde lijst (oss-cache.json).
 * Bezoekers van de site maken dus nooit zelf contact met GitHub.
 */
export function getOss(): Promise<OssData> {
  memo ??= load();
  return memo;
}

async function load(): Promise<OssData> {
  const { repo, author, max_items, exclude } = settings;
  const url = `https://github.com/${repo}/pulls?q=is%3Apr+author%3A${author}`;
  let items: OssItem[] = (cache.items as OssItem[]).slice();

  if (!process.env.OSS_OFFLINE) {
    try {
      const q = encodeURIComponent(`repo:${repo} author:${author} type:pr`);
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'mergentech-website',
      };
      if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
      const res = await fetch(`https://api.github.com/search/issues?q=${q}&per_page=50`, {
        headers,
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = (await res.json()) as { items: any[] };
        const fresh = data.items
          .map((pr) => ({
            number: pr.number as number,
            title: pr.title as string,
            state: pr.pull_request?.merged_at ? 'merged' : pr.state === 'open' ? 'open' : 'closed',
          }))
          .filter((pr) => pr.state !== 'closed') as OssItem[];
        if (fresh.length) items = fresh;
      }
    } catch {
      // geen netwerk tijdens de build: bewaarde lijst gebruiken
    }
  }

  items = items.filter((pr) => !exclude.includes(pr.number));
  return {
    items: items.slice(0, max_items),
    merged: items.filter((pr) => pr.state === 'merged').length,
    total: items.length,
    url,
  };
}
