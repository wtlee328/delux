import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  // 1. Update Products status
  // Drop constraint first
  await pool.query('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check');
  
  // Update data
  await pool.query("UPDATE products SET status = '已退回' WHERE status = '需要修改'");
  
  // Add new constraint with unified status
  await pool.query(`
    ALTER TABLE products 
    ADD CONSTRAINT products_status_check 
    CHECK (status IN ('草稿', '待審核', '已發佈', '已退回'))
  `);

  // 2. Update Supplier Trips status
  // Update data: '審核中' -> '待審核'
  await pool.query("UPDATE supplier_trips SET status = '待審核' WHERE status = '審核中'");
  
  // Add check constraint to trips as well for consistency
  await pool.query("ALTER TABLE supplier_trips DROP CONSTRAINT IF EXISTS supplier_trips_status_check");
  await pool.query(`
    ALTER TABLE supplier_trips 
    ADD CONSTRAINT supplier_trips_status_check 
    CHECK (status IN ('草稿', '待審核', '已通過', '已退回'))
  `);
};

export const down = async (pool: Pool): Promise<void> => {
  // Revert Products
  await pool.query('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check');
  await pool.query("UPDATE products SET status = '需要修改' WHERE status = '已退回'");
  await pool.query(`
    ALTER TABLE products 
    ADD CONSTRAINT products_status_check 
    CHECK (status IN ('草稿', '待審核', '已發佈', '需要修改'))
  `);

  // Revert Trips
  await pool.query('ALTER TABLE supplier_trips DROP CONSTRAINT IF EXISTS supplier_trips_status_check');
  await pool.query("UPDATE supplier_trips SET status = '審核中' WHERE status = '待審核'");
};
