import express, { Request, Response } from 'express';
import * as itineraryService from '../services/itineraryService';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();

// All routes require agency role
router.use(requireAuth, requireRole(['agency']));

// Create a new itinerary
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, timeline } = req.body;
    const agencyUserId = req.user!.userId;

    if (!name || !timeline) {
      return res.status(400).json({ error: '名稱和行程資料為必填' });
    }

    const itinerary = await itineraryService.createItinerary({
      name,
      agencyUserId,
      timeline,
    });

    res.status(201).json(itinerary);
  } catch (error) {
    console.error('Error creating itinerary:', error);
    res.status(500).json({ error: '建立行程失敗' });
  }
});

// Get all itineraries for the current agency
router.get('/', async (req: Request, res: Response) => {
  try {
    const agencyUserId = req.user!.userId;
    const itineraries = await itineraryService.getItinerariesByAgency(agencyUserId);
    res.json(itineraries);
  } catch (error) {
    console.error('Error fetching itineraries:', error);
    res.status(500).json({ error: '取得行程列表失敗' });
  }
});

// Get a specific itinerary
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agencyUserId = req.user!.userId;

    const itinerary = await itineraryService.getItineraryById(id, agencyUserId);

    if (!itinerary) {
      return res.status(404).json({ error: '找不到該行程' });
    }

    res.json(itinerary);
  } catch (error) {
    console.error('Error fetching itinerary:', error);
    res.status(500).json({ error: '取得行程失敗' });
  }
});

// Update an itinerary
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, timeline } = req.body;
    const agencyUserId = req.user!.userId;

    const itinerary = await itineraryService.updateItinerary(id, agencyUserId, {
      name,
      timeline,
    });

    if (!itinerary) {
      return res.status(404).json({ error: '找不到該行程' });
    }

    res.json(itinerary);
  } catch (error) {
    console.error('Error updating itinerary:', error);
    res.status(500).json({ error: '更新行程失敗' });
  }
});

// Delete an itinerary
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agencyUserId = req.user!.userId;

    const success = await itineraryService.deleteItinerary(id, agencyUserId);

    if (!success) {
      return res.status(404).json({ error: '找不到該行程' });
    }

    res.json({ message: '行程已刪除' });
  } catch (error) {
    console.error('Error deleting itinerary:', error);
    res.status(500).json({ error: '刪除行程失敗' });
  }
});

export default router;
