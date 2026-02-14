import fs from 'node:fs/promises'
import path from 'node:path'
import initSqlJs from 'sql.js'

type SqlJsDatabase = {
  run: (sql: string, params?: any[]) => void
  exec: (sql: string) => Array<{ columns: string[]; values: any[][] }>
  export: () => Uint8Array
}

let dbPromise: Promise<SqlJsDatabase> | null = null
const DB_FILE = path.resolve(process.cwd(), 'sessions.sqlite')

async function loadDb(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs()
  let fileData: Uint8Array | null = null

  try {
    fileData = new Uint8Array(await fs.readFile(DB_FILE))
  } catch {
    fileData = null
  }

  const db = new SQL.Database(fileData ?? undefined) as unknown as SqlJsDatabase
  db.run(
    'create table if not exists sessions (token text primary key, user_id text not null, created_at integer not null, last_seen integer not null)'
  )

  return db
}

async function getDb(): Promise<SqlJsDatabase> {
  if (!dbPromise) dbPromise = loadDb()
  return dbPromise
}

async function persistDb(db: SqlJsDatabase): Promise<void> {
  const bytes = db.export()
  await fs.writeFile(DB_FILE, Buffer.from(bytes))
}

export async function upsertSession(token: string, userId: string): Promise<void> {
  const db = await getDb()
  const now = Date.now()
  db.run(
    'insert into sessions (token, user_id, created_at, last_seen) values (?, ?, ?, ?) on conflict(token) do update set last_seen = excluded.last_seen',
    [token, userId, now, now]
  )
  await persistDb(db)
}

export async function touchSession(token: string): Promise<void> {
  const db = await getDb()
  const now = Date.now()
  db.run('update sessions set last_seen = ? where token = ?', [now, token])
  await persistDb(db)
}

export async function getSessionUserId(token: string): Promise<string | null> {
  const db = await getDb()
  const res = db.exec(`select user_id from sessions where token = '${token.replace(/'/g, "''")}' limit 1`)
  const row = res[0]?.values?.[0]
  return row?.[0] ?? null
}

