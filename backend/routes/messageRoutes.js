import express from 'express';
import { getContacts, getMessages, sendMessage, updateMessage, deleteMessage, getUnreadCount } from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/unread-count', authenticateToken, getUnreadCount);
router.get('/contacts', authenticateToken, getContacts);
router.get('/:otherUserId', authenticateToken, getMessages);
router.post('/', authenticateToken, sendMessage);
router.put('/:id', authenticateToken, updateMessage);
router.delete('/:id', authenticateToken, deleteMessage);

export default router;
