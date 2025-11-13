import pool from '../config/database';
import { hashPassword } from '../utils/password';

/**
 * Seed script to create test data for development and testing
 * This creates sample suppliers, agencies, and products
 */
async function seedTestData(): Promise<void> {
  try {
    console.log('Creating test data...');

    const defaultPassword = 'Test1234!';
    const passwordHash = await hashPassword(defaultPassword);

    // Create test supplier users
    const suppliers = [
      { email: 'supplier1@test.com', name: '東京旅遊供應商', role: 'supplier' },
      { email: 'supplier2@test.com', name: '首爾旅遊供應商', role: 'supplier' },
      { email: 'supplier3@test.com', name: '曼谷旅遊供應商', role: 'supplier' },
    ];

    const supplierIds: string[] = [];

    for (const supplier of suppliers) {
      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [supplier.email]
      );

      if (existing.rows.length > 0) {
        console.log(`Supplier ${supplier.email} already exists, skipping...`);
        supplierIds.push(existing.rows[0].id);
        continue;
      }

      const result = await pool.query(
        `INSERT INTO users (email, password_hash, name, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [supplier.email, passwordHash, supplier.name, supplier.role]
      );

      supplierIds.push(result.rows[0].id);
      console.log(`✓ Created supplier: ${supplier.name}`);
    }

    // Create test agency users
    const agencies = [
      { email: 'agency1@test.com', name: '台北旅行社', role: 'agency' },
      { email: 'agency2@test.com', name: '高雄旅行社', role: 'agency' },
    ];

    for (const agency of agencies) {
      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [agency.email]
      );

      if (existing.rows.length > 0) {
        console.log(`Agency ${agency.email} already exists, skipping...`);
        continue;
      }

      await pool.query(
        `INSERT INTO users (email, password_hash, name, role)
         VALUES ($1, $2, $3, $4)`,
        [agency.email, passwordHash, agency.name, agency.role]
      );

      console.log(`✓ Created agency: ${agency.name}`);
    }

    // Create sample products
    const sampleProducts = [
      {
        supplierId: supplierIds[0],
        title: '東京五日精華遊',
        destination: '東京',
        durationDays: 5,
        description: '<h2>行程特色</h2><p>探索東京最精華的景點，包括淺草寺、東京晴空塔、築地市場等。</p><h3>行程亮點</h3><ul><li>專業中文導遊</li><li>四星級酒店住宿</li><li>含早餐</li></ul>',
        coverImageUrl: 'https://storage.googleapis.com/delux-plus-products/sample-tokyo.jpg',
        netPrice: 25000,
        status: 'published',
      },
      {
        supplierId: supplierIds[0],
        title: '富士山一日遊',
        destination: '富士山',
        durationDays: 1,
        description: '<h2>行程特色</h2><p>從東京出發，一日遊覽富士山及周邊景點。</p><h3>包含項目</h3><ul><li>往返交通</li><li>午餐</li><li>導遊服務</li></ul>',
        coverImageUrl: 'https://storage.googleapis.com/delux-plus-products/sample-fuji.jpg',
        netPrice: 3500,
        status: 'published',
      },
      {
        supplierId: supplierIds[1],
        title: '首爾四日購物美食之旅',
        destination: '首爾',
        durationDays: 4,
        description: '<h2>行程特色</h2><p>體驗首爾最熱門的購物區和美食街，包括明洞、東大門、弘大等。</p><h3>特色安排</h3><ul><li>韓式料理體驗</li><li>購物時間充足</li><li>市區酒店</li></ul>',
        coverImageUrl: 'https://storage.googleapis.com/delux-plus-products/sample-seoul.jpg',
        netPrice: 18000,
        status: 'published',
      },
      {
        supplierId: supplierIds[1],
        title: '濟州島三日自然之旅',
        destination: '濟州島',
        durationDays: 3,
        description: '<h2>行程特色</h2><p>探索濟州島的自然美景，包括漢拿山、城山日出峰等。</p>',
        coverImageUrl: 'https://storage.googleapis.com/delux-plus-products/sample-jeju.jpg',
        netPrice: 15000,
        status: 'pending',
      },
      {
        supplierId: supplierIds[2],
        title: '曼谷芭達雅五日遊',
        destination: '曼谷',
        durationDays: 5,
        description: '<h2>行程特色</h2><p>暢遊曼谷和芭達雅，體驗泰國文化和海灘風情。</p><h3>行程包含</h3><ul><li>大皇宮參觀</li><li>水上市場</li><li>芭達雅海灘</li><li>泰式按摩體驗</li></ul>',
        coverImageUrl: 'https://storage.googleapis.com/delux-plus-products/sample-bangkok.jpg',
        netPrice: 22000,
        status: 'published',
      },
      {
        supplierId: supplierIds[2],
        title: '清邁三日文化之旅',
        destination: '清邁',
        durationDays: 3,
        description: '<h2>行程特色</h2><p>深度體驗清邁的文化和自然風光。</p>',
        coverImageUrl: 'https://storage.googleapis.com/delux-plus-products/sample-chiangmai.jpg',
        netPrice: 12000,
        status: 'pending',
      },
    ];

    for (const product of sampleProducts) {
      const existing = await pool.query(
        'SELECT id FROM products WHERE title = $1 AND supplier_id = $2',
        [product.title, product.supplierId]
      );

      if (existing.rows.length > 0) {
        console.log(`Product "${product.title}" already exists, skipping...`);
        continue;
      }

      await pool.query(
        `INSERT INTO products (supplier_id, title, destination, duration_days, description, cover_image_url, net_price, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          product.supplierId,
          product.title,
          product.destination,
          product.durationDays,
          product.description,
          product.coverImageUrl,
          product.netPrice,
          product.status,
        ]
      );

      console.log(`✓ Created product: ${product.title}`);
    }

    console.log('\n-----------------------------------');
    console.log('Test data created successfully!');
    console.log('-----------------------------------');
    console.log('Test User Credentials:');
    console.log(`Password (all users): ${defaultPassword}`);
    console.log('\nSuppliers:');
    suppliers.forEach(s => console.log(`  - ${s.email} (${s.name})`));
    console.log('\nAgencies:');
    agencies.forEach(a => console.log(`  - ${a.email} (${a.name})`));
    console.log('\nProducts created: ' + sampleProducts.length);
    console.log('-----------------------------------');
  } catch (error) {
    console.error('Failed to create test data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seed script
seedTestData();
