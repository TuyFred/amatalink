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
    username: row.username,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    village: row.village,
    sector: row.sector,
  };
}

export function meUserPayload(row) {
  return {
    id: asInt(row.id),
    username: row.username,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone,
    role: row.role,
    village: row.village,
    sector: row.sector,
    created_at: row.created_at,
  };
}
