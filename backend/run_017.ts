import { up } from './src/migrations/017_add_status_to_supplier_trips';
import pool from './src/config/database';

async function run() {
  try {
    await up(pool);
    console.log('Migration 17 (Status to Trips) completed');
    process.exit(0);
  } catch (err) {
    console.error('Migration 17 failed:', err);
    process.exit(1);
  }
}
run();
