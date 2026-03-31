const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:delux@localhost:5432/delux_db' });
async function test() {
  const result = await pool.query("UPDATE products SET status = '待審核', rejection_reason = NULL WHERE id = (SELECT id FROM products WHERE supplier_id IS NOT NULL LIMIT 1) RETURNING *;");
  console.log(result.rows[0]);
  process.exit(0);
}
test();
