import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  // Update all product cover_image_url to use the correct bucket name
  await pool.query(`
    UPDATE products 
    SET cover_image_url = REPLACE(
      cover_image_url, 
      'delux-plus-prod_cloudbuild', 
      'delux-plus-products'
    )
    WHERE cover_image_url LIKE '%delux-plus-prod_cloudbuild%';
  `);
};

export const down = async (pool: Pool): Promise<void> => {
  // Revert back to old bucket name
  await pool.query(`
    UPDATE products 
    SET cover_image_url = REPLACE(
      cover_image_url, 
      'delux-plus-products', 
      'delux-plus-prod_cloudbuild'
    )
    WHERE cover_image_url LIKE '%delux-plus-products%';
  `);
};
