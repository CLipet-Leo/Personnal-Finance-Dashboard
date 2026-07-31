import { type SQLiteDB } from '@/db'

export class DBService {
  private db: SQLiteDB

  constructor(db: SQLiteDB) {
    this.db = db
  }
}
