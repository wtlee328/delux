import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS supplier_trips (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(500) NOT NULL,
      days_count INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS supplier_trip_days (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trip_id UUID NOT NULL REFERENCES supplier_trips(id) ON DELETE CASCADE,
      day_index INTEGER NOT NULL,
      breakfast_id UUID REFERENCES products(id) ON DELETE SET NULL,
      breakfast_custom VARCHAR(255),
      lunch_id UUID REFERENCES products(id) ON DELETE SET NULL,
      lunch_custom VARCHAR(255),
      dinner_id UUID REFERENCES products(id) ON DELETE SET NULL,
      dinner_custom VARCHAR(255),
      hotel_id UUID REFERENCES products(id) ON DELETE SET NULL,
      hotel_custom VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(trip_id, day_index)
    );

    CREATE TABLE IF NOT EXISTS supplier_trip_day_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trip_day_id UUID NOT NULL REFERENCES supplier_trip_days(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_supplier_trips_supplier ON supplier_trips(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_supplier_trip_days_trip ON supplier_trip_days(trip_id);
    CREATE INDEX IF NOT EXISTS idx_supplier_trip_day_items_day ON supplier_trip_day_items(trip_day_id);
  `);
};

export const down = async (pool: Pool): Promise<void> => {
  await pool.query(`
    DROP INDEX IF EXISTS idx_supplier_trip_day_items_day;
    DROP INDEX IF EXISTS idx_supplier_trip_days_trip;
    DROP INDEX IF EXISTS idx_supplier_trips_supplier;
    DROP TABLE IF EXISTS supplier_trip_day_items;
    DROP TABLE IF EXISTS supplier_trip_days;
    DROP TABLE IF EXISTS supplier_trips;
  `);
};
