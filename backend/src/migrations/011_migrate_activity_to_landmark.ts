import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
    // 1. Update all products with category 'activity' to 'landmark'
    await pool.query(`
    UPDATE products 
    SET category = 'landmark' 
    WHERE category = 'activity';
  `);
};

export const down = async (pool: Pool): Promise<void> => {
    // This migration is irreversible as we lose the distinction between original landmarks and converted activities.
    // We could potentially try to revert if we had a backup or audit log, but for this schema change we'll leave it as no-op or simple log.
    console.log('Migration 011_migrate_activity_to_landmark is irreversible.');
};
