import pool from '../config/database';
import * as path from 'path';
import * as fs from 'fs';

interface Migration {
  name: string;
  up: (pool: any) => Promise<void>;
  down: (pool: any) => Promise<void>;
}

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getExecutedMigrations(): Promise<string[]> {
  const result = await pool.query(
    'SELECT name FROM migrations ORDER BY id ASC'
  );
  return result.rows.map((row) => row.name);
}

async function recordMigration(name: string): Promise<void> {
  await pool.query(
    'INSERT INTO migrations (name) VALUES ($1)',
    [name]
  );
}

async function removeMigrationRecord(name: string): Promise<void> {
  await pool.query(
    'DELETE FROM migrations WHERE name = $1',
    [name]
  );
}

async function loadMigrations(): Promise<Migration[]> {
  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
    .filter(file => !file.endsWith('.d.ts')) // Exclude TypeScript declaration files
    .filter(file => file !== 'runner.ts' && file !== 'runner.js' && file !== 'README.md')
    .sort();

  const migrations: Migration[] = [];
  
  for (const file of files) {
    const migrationPath = path.join(migrationsDir, file);
    const migration = await import(migrationPath);
    migrations.push({
      name: file,
      up: migration.up,
      down: migration.down,
    });
  }

  return migrations;
}

async function runMigrations(): Promise<void> {
  try {
    console.log('Starting migrations...');
    
    await ensureMigrationsTable();
    const executedMigrations = await getExecutedMigrations();
    const allMigrations = await loadMigrations();

    const pendingMigrations = allMigrations.filter(
      migration => !executedMigrations.includes(migration.name)
    );

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations.');
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migration(s).`);

    for (const migration of pendingMigrations) {
      console.log(`Running migration: ${migration.name}`);
      await migration.up(pool);
      await recordMigration(migration.name);
      console.log(`✓ Completed: ${migration.name}`);
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function rollbackLastMigration(): Promise<void> {
  try {
    console.log('Rolling back last migration...');
    
    await ensureMigrationsTable();
    const executedMigrations = await getExecutedMigrations();

    if (executedMigrations.length === 0) {
      console.log('No migrations to rollback.');
      return;
    }

    const lastMigration = executedMigrations[executedMigrations.length - 1];
    const allMigrations = await loadMigrations();
    const migration = allMigrations.find(m => m.name === lastMigration);

    if (!migration) {
      throw new Error(`Migration file not found: ${lastMigration}`);
    }

    console.log(`Rolling back: ${migration.name}`);
    await migration.down(pool);
    await removeMigrationRecord(migration.name);
    console.log(`✓ Rolled back: ${migration.name}`);
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// CLI interface
const command = process.argv[2];

if (command === 'up' || !command) {
  runMigrations();
} else if (command === 'down') {
  rollbackLastMigration();
} else {
  console.error('Unknown command. Use "up" or "down".');
  process.exit(1);
}
