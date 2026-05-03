import express from 'express';
import { getNotifications, markAsRead, getUnreadCount, sendDailyMilkSummary } from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes (previously authenticated)

// Get user notifications
router.get('/', authenticateToken, getNotifications);

// Get unread count
router.get('/unread-count', authenticateToken, getUnreadCount);

// Mark notification as read
router.put('/:notificationId/read', authenticateToken, markAsRead);

// Route to send daily milk summary emails
router.post('/send-daily-summary', async (req, res) => {
    const { farmerName, litres, earnings } = req.body;

    if (!farmerName || !litres || !earnings) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await sendDailyMilkSummary(farmerName, litres, earnings);
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
});

export default router;
