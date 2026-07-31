import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

// Le HMR réévalue ce module à chaque édition : sans ce cache, chaque rechargement
// ouvrirait une connexion supplémentaire sans jamais fermer les précédentes.
const globalForDb = globalThis as { sqlite?: Database.Database }

const sqlite =
  globalForDb.sqlite ??
  (() => {
    const connection = new Database('data/dashboard.db')
    connection.pragma('journal_mode = WAL') // meilleures perfs en lecture/écriture concurrentes
    return connection
  })()

if (process.env.NODE_ENV !== 'production') globalForDb.sqlite = sqlite

export const db = drizzle(sqlite, { schema })
export type SQLiteDB = typeof db
