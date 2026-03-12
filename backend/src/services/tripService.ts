import pool from '../config/database';
import { Product } from './productService';

export interface TripDayItem {
  id?: string;
  productId: string;
  sortOrder: number;
}

export interface TripDay {
  id?: string;
  dayIndex: number;
  breakfastId?: string | null;
  breakfastCustom?: string | null;
  lunchId?: string | null;
  lunchCustom?: string | null;
  dinnerId?: string | null;
  dinnerCustom?: string | null;
  hotelId?: string | null;
  hotelCustom?: string | null;
  notes?: string | null;
  items: TripDayItem[];
}

export type TripStatus = '草稿' | '審核中' | '已通過' | '已退回';

export interface Trip {
  id: string;
  supplierId: string;
  name: string;
  destination: string;
  category: string;
  daysCount: number;
  status: TripStatus;
  rejectionReason?: string;
  days?: TripDay[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTripRequest {
  supplierId: string;
  name: string;
  destination: string;
  category: string;
  daysCount: number;
  days: Omit<TripDay, 'id'>[];
}

export interface UpdateTripRequest {
  name: string;
  destination: string;
  category: string;
  daysCount: number;
  days: Omit<TripDay, 'id'>[];
}

export async function createTrip(tripData: CreateTripRequest): Promise<Trip> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert Trip
    const tripResult = await client.query(
      `INSERT INTO supplier_trips (supplier_id, name, destination, category, days_count, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tripData.supplierId, tripData.name, tripData.destination, tripData.category || '團體旅遊', tripData.daysCount, '草稿']
    );
    const trip = tripResult.rows[0];

    // Insert Days
    for (const day of tripData.days) {
      const dayResult = await client.query(
        `INSERT INTO supplier_trip_days 
          (trip_id, day_index, breakfast_id, breakfast_custom, lunch_id, lunch_custom, dinner_id, dinner_custom, hotel_id, hotel_custom, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          trip.id, day.dayIndex, 
          day.breakfastId || null, day.breakfastCustom || null,
          day.lunchId || null, day.lunchCustom || null,
          day.dinnerId || null, day.dinnerCustom || null,
          day.hotelId || null, day.hotelCustom || null,
          day.notes || null
        ]
      );
      const tripDay = dayResult.rows[0];

      // Insert Day Items
      if (day.items && day.items.length > 0) {
        for (const item of day.items) {
          await client.query(
            `INSERT INTO supplier_trip_day_items (trip_day_id, product_id, sort_order)
             VALUES ($1, $2, $3)`,
            [tripDay.id, item.productId, item.sortOrder]
          );
        }
      }
    }

    await client.query('COMMIT');

    return getTripById(trip.id, tripData.supplierId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getTripsBySupplier(supplierId: string): Promise<Trip[]> {
  const result = await pool.query(
    `SELECT * FROM supplier_trips WHERE supplier_id = $1 ORDER BY created_at DESC`,
    [supplierId]
  );

  return result.rows.map(row => ({
    id: row.id,
    supplierId: row.supplier_id,
    name: row.name,
    destination: row.destination,
    category: row.category,
    daysCount: row.days_count,
    status: row.status as TripStatus,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function getTripById(id: string, supplierId: string): Promise<Trip> {
  // Check ownership
  const tripCheck = await pool.query(
    'SELECT * FROM supplier_trips WHERE id = $1 AND supplier_id = $2',
    [id, supplierId]
  );
  if (tripCheck.rows.length === 0) {
    throw new Error('Trip not found or access denied');
  }
  const row = tripCheck.rows[0];
  const trip: Trip = {
    id: row.id,
    supplierId: row.supplier_id,
    name: row.name,
    destination: row.destination,
    category: row.category,
    daysCount: row.days_count,
    status: row.status as TripStatus,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    days: []
  };

  // Fetch Days
  const daysResult = await pool.query(
    'SELECT * FROM supplier_trip_days WHERE trip_id = $1 ORDER BY day_index ASC',
    [id]
  );
  
  for (const dayRow of daysResult.rows) {
    const day: any = {
      id: dayRow.id,
      dayIndex: dayRow.day_index,
      breakfastId: dayRow.breakfast_id,
      breakfastCustom: dayRow.breakfast_custom,
      lunchId: dayRow.lunch_id,
      lunchCustom: dayRow.lunch_custom,
      dinnerId: dayRow.dinner_id,
      dinnerCustom: dayRow.dinner_custom,
      hotelId: dayRow.hotel_id,
      hotelCustom: dayRow.hotel_custom,
      notes: dayRow.notes,
      items: []
    };

    // Fetch items with product titles for this day
    const itemsResult = await pool.query(
      `SELECT i.*, p.title as product_title 
       FROM supplier_trip_day_items i 
       LEFT JOIN products p ON i.product_id = p.id 
       WHERE i.trip_day_id = $1 
       ORDER BY i.sort_order ASC`,
      [dayRow.id]
    );

    day.items = itemsResult.rows.map(itemRow => ({
      id: itemRow.id,
      productId: itemRow.product_id,
      productTitle: itemRow.product_title,
      sortOrder: itemRow.sort_order
    }));

    // Fetch meal and hotel titles if they are IDs
    const mealHotelIds = [dayRow.breakfast_id, dayRow.lunch_id, dayRow.dinner_id, dayRow.hotel_id].filter(Boolean);
    if (mealHotelIds.length > 0) {
      const productsResult = await pool.query(
        'SELECT id, title FROM products WHERE id = ANY($1)',
        [mealHotelIds]
      );
      const productMap = productsResult.rows.reduce((acc: any, p: any) => {
        acc[p.id] = p.title;
        return acc;
      }, {});

      if (dayRow.breakfast_id) day.breakfastTitle = productMap[dayRow.breakfast_id];
      if (dayRow.lunch_id) day.lunchTitle = productMap[dayRow.lunch_id];
      if (dayRow.dinner_id) day.dinnerTitle = productMap[dayRow.dinner_id];
      if (dayRow.hotel_id) day.hotelTitle = productMap[dayRow.hotel_id];
    }

    trip.days!.push(day);
  }

  return trip;
}

export async function updateTrip(id: string, supplierId: string, updateData: UpdateTripRequest): Promise<Trip> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check ownership
    const ownershipResult = await client.query(
      'SELECT id FROM supplier_trips WHERE id = $1 AND supplier_id = $2',
      [id, supplierId]
    );
    if (ownershipResult.rows.length === 0) {
      throw new Error('Trip not found or access denied');
    }

    // Update Trip Master Record
    // Note: Editing a trip resets it to '草稿' or keeps it in current non-reviewed state
    await client.query(
      `UPDATE supplier_trips 
       SET name = $1, destination = $2, category = $3, days_count = $4, status = $5, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6`,
      [updateData.name, updateData.destination, updateData.category || '團體旅遊', updateData.daysCount, '草稿', id]
    );

    // To prevent complex diffing for days/items, we delete old days, which cascades to delete items
    await client.query('DELETE FROM supplier_trip_days WHERE trip_id = $1', [id]);

    // Reinsert days and items
    for (const day of updateData.days) {
      const dayResult = await client.query(
        `INSERT INTO supplier_trip_days 
          (trip_id, day_index, breakfast_id, breakfast_custom, lunch_id, lunch_custom, dinner_id, dinner_custom, hotel_id, hotel_custom, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          id, day.dayIndex, 
          day.breakfastId || null, day.breakfastCustom || null,
          day.lunchId || null, day.lunchCustom || null,
          day.dinnerId || null, day.dinnerCustom || null,
          day.hotelId || null, day.hotelCustom || null,
          day.notes || null
        ]
      );
      const tripDay = dayResult.rows[0];

      if (day.items && day.items.length > 0) {
        for (const item of day.items) {
          await client.query(
            `INSERT INTO supplier_trip_day_items (trip_day_id, product_id, sort_order)
             VALUES ($1, $2, $3)`,
            [tripDay.id, item.productId, item.sortOrder]
          );
        }
      }
    }

    await client.query('COMMIT');
    
    return getTripById(id, supplierId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteTrip(id: string, supplierId: string): Promise<void> {
  const result = await pool.query(
    'DELETE FROM supplier_trips WHERE id = $1 AND supplier_id = $2 RETURNING id',
    [id, supplierId]
  );
  if (result.rows.length === 0) {
    throw new Error('Trip not found or access denied');
  }
}

/**
 * Update trip status with validation
 * Suppliers can only submit for review if all products are approved
 */
export async function updateTripStatus(
  id: string,
  status: TripStatus,
  supplierId?: string,
  rejectionReason?: string
): Promise<Trip> {
  // If supplierId is provided, verify ownership
  if (supplierId) {
    const ownershipCheck = await pool.query(
      'SELECT id FROM supplier_trips WHERE id = $1 AND supplier_id = $2',
      [id, supplierId]
    );

    if (ownershipCheck.rows.length === 0) {
      throw new Error('Trip not found or access denied');
    }

    // If submitting for review, check all products
    if (status === '審核中') {
      const unapprovedProducts = await pool.query(`
        SELECT p.title 
        FROM products p
        WHERE p.id IN (
          SELECT product_id FROM supplier_trip_day_items WHERE trip_day_id IN (
            SELECT id FROM supplier_trip_days WHERE trip_id = $1
          )
          UNION
          SELECT breakfast_id FROM supplier_trip_days WHERE trip_id = $1 AND breakfast_id IS NOT NULL
          UNION
          SELECT lunch_id FROM supplier_trip_days WHERE trip_id = $1 AND lunch_id IS NOT NULL
          UNION
          SELECT dinner_id FROM supplier_trip_days WHERE trip_id = $1 AND dinner_id IS NOT NULL
          UNION
          SELECT hotel_id FROM supplier_trip_days WHERE trip_id = $1 AND hotel_id IS NOT NULL
        )
        AND p.status != '已發佈'
      `, [id]);

      if (unapprovedProducts.rows.length > 0) {
        throw new Error('此行程包含尚未審核通過的產品，請先完成產品審核後再提交行程審核。');
      }
    }
  }

  const updates: string[] = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
  const values: any[] = [status, id];
  let paramCount = 3;

  if (rejectionReason !== undefined) {
    updates.push(`rejection_reason = $${paramCount++}`);
    values.push(rejectionReason);
  }

  const result = await pool.query(
    `UPDATE supplier_trips
     SET ${updates.join(', ')}
     WHERE id = $2
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Trip not found');
  }

  return getTripById(id, supplierId || result.rows[0].supplier_id);
}

/**
 * Get trips by status (for admin)
 */
export async function getTripsByStatus(status: TripStatus): Promise<Trip[]> {
  const result = await pool.query(
    `SELECT * FROM supplier_trips WHERE status = $1 ORDER BY created_at DESC`,
    [status]
  );

  return result.rows.map(row => ({
    id: row.id,
    supplierId: row.supplier_id,
    name: row.name,
    destination: row.destination,
    category: row.category,
    daysCount: row.days_count,
    status: row.status as TripStatus,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}
