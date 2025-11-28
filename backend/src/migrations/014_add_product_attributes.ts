import { Pool } from 'pg';

export const up = async (pool: Pool) => {
    await pool.query(`
    ALTER TABLE products
    ADD COLUMN has_shopping BOOLEAN DEFAULT FALSE,
    ADD COLUMN has_ticket BOOLEAN DEFAULT FALSE,
    ADD COLUMN ticket_price DECIMAL(10, 2),
    ADD COLUMN duration DECIMAL(4, 1) DEFAULT 1.0;
  `);
};

export const down = async (pool: Pool) => {
    await pool.query(`
    ALTER TABLE products
    DROP COLUMN has_shopping,
    DROP COLUMN has_ticket,
    DROP COLUMN ticket_price,
    DROP COLUMN duration;
  `);
};
