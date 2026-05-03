import express from 'express';
import { addMilkRecord, getCollectorRecords, getFarmerRecords, getCollectorTodaySummary } from '../controllers/milkController.js';
import { getFarmersForCollector } from '../controllers/milkController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Add milk record (Village Collector)
router.post('/record', authenticateToken, addMilkRecord);

// Get collector's records
router.get('/collector/records', authenticateToken, getCollectorRecords);

// Get farmer's records
router.get('/farmer/records', authenticateToken, getFarmerRecords);

// Get today's summary for collector
router.get('/collector/today', authenticateToken, getCollectorTodaySummary);

// Get farmers list (for collectors)
router.get('/farmers', authenticateToken, getFarmersForCollector);

export default router;
