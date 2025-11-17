import pool from '../config/database';

interface TimelineDay {
  dayNumber: number;
  items: Array<{
    id: string;
    title: string;
    notes?: string;
  }>;
}

interface CreateItineraryData {
  name: string;
  agencyUserId: string;
  timeline: TimelineDay[];
}

interface Itinerary {
  id: string;
  name: string;
  agencyUserId: string;
  timelineData: TimelineDay[];
  createdAt: Date;
  updatedAt: Date;
}

export const createItinerary = async (data: CreateItineraryData): Promise<Itinerary> => {
  const { name, agencyUserId, timeline } = data;

  const result = await pool.query(
    `INSERT INTO itineraries (name, agency_user_id, timeline_data)
     VALUES ($1, $2, $3)
     RETURNING id, name, agency_user_id as "agencyUserId", 
               timeline_data as "timelineData", created_at as "createdAt", 
               updated_at as "updatedAt"`,
    [name, agencyUserId, JSON.stringify(timeline)]
  );

  return result.rows[0];
};

export const getItinerariesByAgency = async (agencyUserId: string): Promise<Itinerary[]> => {
  const result = await pool.query(
    `SELECT id, name, agency_user_id as "agencyUserId", 
            timeline_data as "timelineData", created_at as "createdAt", 
            updated_at as "updatedAt"
     FROM itineraries
     WHERE agency_user_id = $1
     ORDER BY created_at DESC`,
    [agencyUserId]
  );

  return result.rows;
};

export const getItineraryById = async (id: string, agencyUserId: string): Promise<Itinerary | null> => {
  const result = await pool.query(
    `SELECT id, name, agency_user_id as "agencyUserId", 
            timeline_data as "timelineData", created_at as "createdAt", 
            updated_at as "updatedAt"
     FROM itineraries
     WHERE id = $1 AND agency_user_id = $2`,
    [id, agencyUserId]
  );

  return result.rows[0] || null;
};

export const updateItinerary = async (
  id: string,
  agencyUserId: string,
  data: { name?: string; timeline?: TimelineDay[] }
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

  if (updates.length === 0) {
    return getItineraryById(id, agencyUserId);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id, agencyUserId);

  const result = await pool.query(
    `UPDATE itineraries
     SET ${updates.join(', ')}
     WHERE id = $${paramCount++} AND agency_user_id = $${paramCount++}
     RETURNING id, name, agency_user_id as "agencyUserId", 
               timeline_data as "timelineData", created_at as "createdAt", 
               updated_at as "updatedAt"`,
    values
  );

  return result.rows[0] || null;
};

export const deleteItinerary = async (id: string, agencyUserId: string): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM itineraries
     WHERE id = $1 AND agency_user_id = $2`,
    [id, agencyUserId]
  );

  return result.rowCount !== null && result.rowCount > 0;
};
