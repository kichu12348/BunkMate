import * as SQLite from "expo-sqlite";

export class Database {
  private static instance: Database;
  private db: SQLite.SQLiteDatabase;
  private keySet: Set<string>;

  private constructor() {
    this.db = SQLite.openDatabaseSync("bunkmate_cache.db");
    this.keySet = new Set();
    this.initTables();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private initTables() {
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    const keys = this.db.getAllSync("SELECT key FROM kv_store");
    keys.forEach((row: { key: string }) => {
      this.keySet.add(row.key);
    });
  }

  public getDatabase(): SQLite.SQLiteDatabase {
    return this.db;
  }

  public async clearAllTables(): Promise<void> {
    this.db.execSync("DELETE FROM cache");
    this.db.execSync("DELETE FROM attendance_subjects");
    this.db.execSync("DELETE FROM attendance_summary");
    this.db.execSync("DELETE FROM kv_store");
    this.keySet.clear();
    this.initTables(); // Reinitialize the kv_store table
  }

  ///kv store

  public async set(key: string, value: string): Promise<void> {
    await this.db.runAsync(
      `
      INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)
    `,
      [key, value]
    );
    this.keySet.add(key);
  }

  public async get(key: string): Promise<string | null> {
    if (!this.keySet.has(key)) {
      return null;
    }
    const result: { value: string } | null = await this.db.getFirstAsync(
      `
      SELECT value FROM kv_store WHERE key = ?
    `,
      [key]
    );
    return result ? result.value : null;
  }

  public async delete(key: string): Promise<void> {
    if (!this.keySet.has(key)) {
      return;
    }
    await this.db.runAsync(
      `
      DELETE FROM kv_store WHERE key = ?
    `,
      [key]
    );
    this.keySet.delete(key);
  }

  public async has(key: string): Promise<boolean> {
    return this.keySet.has(key);
  }

  public async getAllKeys(): Promise<string[]> {
    return Array.from(this.keySet);
  }
}

export const database = Database.getInstance();
