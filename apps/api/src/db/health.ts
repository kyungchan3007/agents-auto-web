// D1 연결 확인 — /health
export async function dbAlive(d1: D1Database): Promise<boolean> {
  return d1
    .prepare("select 1 as ok")
    .first<{ ok: number }>()
    .then((r) => r?.ok === 1)
    .catch(() => false);
}
