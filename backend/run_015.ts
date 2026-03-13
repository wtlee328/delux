import { up } from './src/migrations/015_create_supplier_trips_tables';
import pool from './src/config/database';

async function run() {
  await up(pool);
  console.log('Migration 15 completed');
  process.exit(0);
}
run();
