/** Safe string for JWT / JSON (handles Buffer from some MySQL column types). */
export function rowText(v) {
  if (v == null || v === '') return v;
  if (Buffer.isBuffer(v)) return v.toString('utf8');
  return String(v);
}

/** mysql2 may return BIGINT as BigInt — Express res.json() cannot serialize BigInt (throws → 500). */
export function asInt(value) {
  if (value == null) return value;
  if (typeof value === 'bigint') return Number(value);
  return Number(value);
}

/** Normalize password column for bcrypt (Buffer from BINARY columns, etc.). */
export function storedPasswordHash(pw) {
  if (pw == null || pw === '') return null;
  if (Buffer.isBuffer(pw)) return pw.toString('utf8');
  return String(pw);
}

export function loginUserPayload(row) {
  return {
    id: asInt(row.id),
    username: rowText(row.username),
    email: rowText(row.email),
    fullName: rowText(row.full_name),
    phone: row.phone != null ? rowText(row.phone) : row.phone,
    role: rowText(row.role),
    village: row.village != null ? rowText(row.village) : row.village,
    sector: row.sector != null ? rowText(row.sector) : row.sector,
  };
}

export function meUserPayload(row) {
  return {
    id: asInt(row.id),
    username: rowText(row.username),
    email: rowText(row.email),
    full_name: rowText(row.full_name),
    phone: row.phone != null ? rowText(row.phone) : row.phone,
    role: rowText(row.role),
    village: row.village != null ? rowText(row.village) : row.village,
    sector: row.sector != null ? rowText(row.sector) : row.sector,
    created_at: row.created_at,
  };
}
