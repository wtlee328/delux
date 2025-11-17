import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  // Drop the existing constraint
  await pool.query(`
    ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
  `);

  // Update existing status values to new Chinese values
  await pool.query(`
    UPDATE products SET status = '待審核' WHERE status = 'pending';
    UPDATE products SET status = '已發佈' WHERE status = 'published';
  `);

  // Add new constraint with all four status values
  await pool.query(`
    ALTER TABLE products 
    ADD CONSTRAINT products_status_check 
    CHECK (status IN ('草稿', '待審核', '已發佈', '需要修改'));
  `);

  // Update default status to '草稿'
  await pool.query(`
    ALTER TABLE products ALTER COLUMN status SET DEFAULT '草稿';
  `);
};

export const down = async (pool: Pool): Promise<void> => {
  // Drop the new constraint
  await pool.query(`
    ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
  `);

  // Revert status values to English
  await pool.query(`
    UPDATE products SET status = 'pending' WHERE status IN ('草稿', '待審核', '需要修改');
    UPDATE products SET status = 'published' WHERE status = '已發佈';
  `);

  // Restore original constraint
  await pool.query(`
    ALTER TABLE products 
    ADD CONSTRAINT products_status_check 
    CHECK (status IN ('pending', 'published'));
  `);

  // Restore default status to 'pending'
  await pool.query(`
    ALTER TABLE products ALTER COLUMN status SET DEFAULT 'pending';
  `);
};
