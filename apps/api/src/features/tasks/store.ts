// 작업 목록 읽기 — 쓰기는 GitHub Actions 가 D1 에 바로
import { desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { githubItems, taskSnags } from "../../db/schema";

export async function taskRows(d1: D1Database) {
  const db = drizzle(d1);
  const [rows, snagRows] = await Promise.all([db.select().from(githubItems).orderBy(desc(githubItems.number)), db.select().from(taskSnags)]);
  return { rows, snagRows };
}
