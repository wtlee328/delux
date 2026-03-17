import { up } from './src/migrations/016_add_destination_to_supplier_trips';
import pool from './src/config/database';

async function run() {
  await up(pool);
  console.log('Migration 16 completed');
  process.exit(0);
}
run();
