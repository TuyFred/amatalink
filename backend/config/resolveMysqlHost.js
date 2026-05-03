/**
 * Normalizes DB_HOST from Render/env (common mistakes: full URL, jdbc:, https://, trailing slash).
 * Returns { host, port } for mysql2 pool.
 */
export function resolveMysqlHost() {
  let raw = (process.env.DB_HOST || '').trim();
  const envPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;
  if (!raw) {
    return { host: 'localhost', port: envPort };
  }

  // jdbc:mysql://host:3306/db
  if (raw.toLowerCase().startsWith('jdbc:mysql://')) {
    raw = raw.slice('jdbc:mysql://'.length);
  }

  // mysql://user:pass@host:port/db or https:// mistaken paste
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
    try {
      const asHttp = raw.replace(/^mysql:/i, 'http:');
      const u = new URL(asHttp);
      return {
        host: u.hostname || 'localhost',
        port: envPort ?? (u.port ? Number(u.port) : undefined),
      };
    } catch {
      // fall through to simple split
    }
  }

  let host = raw.replace(/^https?:\/\//i, '');
  if (host.includes('@')) {
    host = host.split('@').pop();
  }
  host = host.split('/')[0];

  const lastColon = host.lastIndexOf(':');
  if (lastColon > 0) {
    const maybePort = host.slice(lastColon + 1);
    if (/^\d+$/.test(maybePort)) {
      return {
        host: host.slice(0, lastColon),
        port: envPort ?? Number(maybePort),
      };
    }
  }

  return { host, port: envPort };
}
