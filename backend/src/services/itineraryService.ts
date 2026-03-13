import pool from '../config/database';

interface CreateItineraryData {
  name: string;
  agencyUserId: string;
  timeline: any[];
  destination?: string;
  daysCount?: number;
  startDate?: string;
  endDate?: string;
}

interface Itinerary {
  id: string;
  name: string;
  agencyUserId: string;
  timelineData: any[];
  destination?: string;
  daysCount?: number;
  startDate?: Date;
  endDate?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const mapRowToItinerary = (row: any): Itinerary => ({
  id: row.id,
  name: row.name,
  agencyUserId: row.agencyUserId,
  timelineData: row.timelineData,
  destination: row.destination,
  daysCount: row.daysCount,
  startDate: row.startDate,
  endDate: row.endDate,
  status: row.status,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const createItinerary = async (data: CreateItineraryData): Promise<Itinerary> => {
  const { name, agencyUserId, timeline, destination, daysCount, startDate, endDate } = data;

  const result = await pool.query(
    `INSERT INTO itineraries (name, agency_user_id, timeline_data, destination, days_count, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, agency_user_id as "agencyUserId", 
               timeline_data as "timelineData", destination, days_count as "daysCount",
               start_date as "startDate", end_date as "endDate", status,
               created_at as "createdAt", updated_at as "updatedAt"`,
    [name, agencyUserId, JSON.stringify(timeline), destination, daysCount, startDate, endDate]
  );

  return mapRowToItinerary(result.rows[0]);
};

export const getItinerariesByAgency = async (agencyUserId: string): Promise<Itinerary[]> => {
  const result = await pool.query(
    `SELECT id, name, agency_user_id as "agencyUserId", 
            timeline_data as "timelineData", destination, days_count as "daysCount",
            start_date as "startDate", end_date as "endDate", status,
            created_at as "createdAt", updated_at as "updatedAt"
     FROM itineraries
     WHERE agency_user_id = $1
     ORDER BY created_at DESC`,
    [agencyUserId]
  );

  return result.rows.map(mapRowToItinerary);
};

export const getItineraryById = async (id: string, agencyUserId: string): Promise<Itinerary | null> => {
  const result = await pool.query(
    `SELECT id, name, agency_user_id as "agencyUserId", 
            timeline_data as "timelineData", destination, days_count as "daysCount",
            start_date as "startDate", end_date as "endDate", status,
            created_at as "createdAt", updated_at as "updatedAt"
     FROM itineraries
     WHERE id = $1 AND agency_user_id = $2`,
    [id, agencyUserId]
  );

  if (!result.rows[0]) return null;
  return mapRowToItinerary(result.rows[0]);
};

export const updateItinerary = async (
  id: string,
  agencyUserId: string,
  data: { 
    name?: string; 
    timeline?: any[];
    destination?: string;
    daysCount?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
  }
): Promise<Itinerary | null> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(data.name);
  }

  if (data.timeline !== undefined) {
    updates.push(`timeline_data = $${paramCount++}`);
    values.push(JSON.stringify(data.timeline));
  }

  if (data.destination !== undefined) {
    updates.push(`destination = $${paramCount++}`);
    values.push(data.destination);
  }

  if (data.daysCount !== undefined) {
    updates.push(`days_count = $${paramCount++}`);
    values.push(data.daysCount);
  }

  if (data.startDate !== undefined) {
    updates.push(`start_date = $${paramCount++}`);
    values.push(data.startDate);
  }

  if (data.endDate !== undefined) {
    updates.push(`end_date = $${paramCount++}`);
    values.push(data.endDate);
  }

  if (data.status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(data.status);
  }

  if (updates.length === 0) {
    return getItineraryById(id, agencyUserId);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  
  const query = `
    UPDATE itineraries
    SET ${updates.join(', ')}
    WHERE id = $${paramCount++} AND agency_user_id = $${paramCount++}
    RETURNING id, name, agency_user_id as "agencyUserId", 
              timeline_data as "timelineData", destination, days_count as "daysCount",
              start_date as "startDate", end_date as "endDate", status,
              created_at as "createdAt", updated_at as "updatedAt"
  `;
  
  values.push(id, agencyUserId);

  const result = await pool.query(query, values);

  if (!result.rows[0]) return null;
  return mapRowToItinerary(result.rows[0]);
};

export const deleteItinerary = async (id: string, agencyUserId: string): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM itineraries
     WHERE id = $1 AND agency_user_id = $2`,
    [id, agencyUserId]
  );

  return result.rowCount !== null && result.rowCount > 0;
};
