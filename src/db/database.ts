import * as SQLite from 'expo-sqlite';

export class Database {
  private static instance: Database;
  private db: SQLite.SQLiteDatabase;

  private constructor() {
    this.db = SQLite.openDatabaseSync('bunkmate_cache.db');
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
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      )
    `);

    // Attendance specific tables
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS attendance_subjects (
        id INTEGER PRIMARY KEY,
        subject_id INTEGER NOT NULL,
        subject_name TEXT NOT NULL,
        subject_code TEXT NOT NULL,
        total_classes INTEGER NOT NULL,
        attended_classes INTEGER NOT NULL,
        percentage REAL NOT NULL,
        last_updated TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS attendance_summary (
        id INTEGER PRIMARY KEY,
        total_subjects INTEGER NOT NULL,
        overall_percentage REAL NOT NULL,
        last_updated TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Course schedule table with user overrides and conflict tracking
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS course_schedule (
        id INTEGER PRIMARY KEY,
        subject_id TEXT NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        day INTEGER NOT NULL,
        hour INTEGER NOT NULL,
        teacher_attendance TEXT,
        user_attendance TEXT,
        final_attendance TEXT,
        is_conflict INTEGER DEFAULT 0,
        is_user_override INTEGER DEFAULT 0,
        is_entered_by_professor INTEGER DEFAULT 0,
        is_entered_by_student INTEGER DEFAULT 0,
        last_teacher_update INTEGER,
        last_user_update INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(subject_id, year, month, day, hour)
      )
    `);

    // Create indexes for better performance
    this.db.execSync(`
      CREATE INDEX IF NOT EXISTS idx_course_schedule_subject_date 
      ON course_schedule(subject_id, year, month, day)
    `);
    
    this.db.execSync(`
      CREATE INDEX IF NOT EXISTS idx_course_schedule_date 
      ON course_schedule(year, month, day)
    `);

    // Run migration for existing data
    //this.runMigrations();
  }

  private runMigrations() {
    // Check if new columns exist and add them if they don't
    try {
      // Try to add new columns (will silently fail if they already exist)
      this.db.execSync(`ALTER TABLE course_schedule ADD COLUMN is_entered_by_professor INTEGER DEFAULT 0`);
    } catch (error) {
      // Column already exists
    }
    
    try {
      this.db.execSync(`ALTER TABLE course_schedule ADD COLUMN is_entered_by_student INTEGER DEFAULT 0`);
    } catch (error) {
      // Column already exists
    }

    // Update existing records to set the appropriate flags
    this.db.execSync(`
      UPDATE course_schedule 
      SET is_entered_by_professor = 1 
      WHERE teacher_attendance IS NOT NULL AND is_entered_by_professor = 0
    `);

    this.db.execSync(`
      UPDATE course_schedule 
      SET is_entered_by_student = 1 
      WHERE user_attendance IS NOT NULL AND is_entered_by_student = 0
    `);
  }

  public getDatabase(): SQLite.SQLiteDatabase {
    return this.db;
  }

  public async clearAllTables(): Promise<void> {
    this.db.execSync('DELETE FROM cache');
    this.db.execSync('DELETE FROM attendance_subjects');
    this.db.execSync('DELETE FROM attendance_summary');
    // Only clear teacher attendance but preserve user overrides
    this.db.execSync(`UPDATE course_schedule 
                      SET teacher_attendance = NULL, 
                          final_attendance = user_attendance,
                          is_conflict = 0,
                          last_teacher_update = NULL
                      WHERE is_user_override = 1`);
    this.db.execSync('DELETE FROM course_schedule WHERE is_user_override = 0');
  }
}

export const database = Database.getInstance();
