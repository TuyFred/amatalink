import pool from '../config/database.js';

export const getContacts = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        let contacts = [];

        if (role === 'farmer') {
            // Farmers see their collector and admins
            const [collectorRows] = await pool.execute(`
                SELECT u.id, u.full_name, u.role, 'collector' as type
                FROM users u
                JOIN collectors c ON u.id = c.user_id
                JOIN farmers f ON c.id = f.collector_id
                WHERE f.user_id = ?
            `, [userId]);
            
            const [adminRows] = await pool.execute(`
                SELECT id, full_name, role, 'admin' as type
                FROM users
                WHERE role = 'admin'
            `);
            
            contacts = [...collectorRows, ...adminRows];
        } else if (role === 'collector') {
            // Collectors see their farmers and admins
            const [farmerRows] = await pool.execute(`
                SELECT u.id, u.full_name, u.role, 'farmer' as type
                FROM users u
                JOIN farmers f ON u.id = f.user_id
                JOIN collectors c ON f.collector_id = c.id
                WHERE c.user_id = ?
            `, [userId]);
            
            const [adminRows] = await pool.execute(`
                SELECT id, full_name, role, 'admin' as type
                FROM users
                WHERE role = 'admin'
            `);
            
            contacts = [...farmerRows, ...adminRows];
        } else if (role === 'admin') {
            // Admins see all collectors and some farmers (e.g. all)
            const [allUsers] = await pool.execute(`
                SELECT id, full_name, role, role as type
                FROM users
                WHERE role IN ('collector', 'farmer', 'admin') AND id != ?
            `, [userId]);
            contacts = allUsers;
        }

        res.json(contacts);
    } catch (error) {
        console.error('getContacts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.params;

        const [messages] = await pool.execute(`
            SELECT * FROM messages
            WHERE (sender_id = ? AND receiver_id = ?)
               OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at ASC
        `, [userId, otherUserId, otherUserId, userId]);

        // Mark messages from other user as read
        await pool.execute(`
            UPDATE messages SET is_read = 1
            WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
        `, [otherUserId, userId]);

        res.json(messages);
    } catch (error) {
        console.error('getMessages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId, message } = req.body;

        if (!receiverId || !message) {
            return res.status(400).json({ message: 'Receiver and message required' });
        }

        const [result] = await pool.execute(`
            INSERT INTO messages (sender_id, receiver_id, message)
            VALUES (?, ?, ?)
        `, [senderId, receiverId, message]);

        const newMessage = {
            id: result.insertId,
            sender_id: senderId,
            receiver_id: receiverId,
            message,
            is_read: 0,
            created_at: new Date()
        };

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('sendMessage error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message text required' });
        }

        const [result] = await pool.execute(`
            UPDATE messages SET message = ? 
            WHERE id = ? AND sender_id = ?
        `, [message, id, userId]);

        if (result.affectedRows === 0) {
            return res.status(403).json({ message: 'Unauthorized or message not found' });
        }

        res.json({ id, message });
    } catch (error) {
        console.error('updateMessage error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [result] = await pool.execute(`
            DELETE FROM messages 
            WHERE id = ? AND sender_id = ?
        `, [id, userId]);

        if (result.affectedRows === 0) {
            return res.status(403).json({ message: 'Unauthorized or message not found' });
        }

        res.json({ message: 'Message deleted successfully', id });
    } catch (error) {
        console.error('deleteMessage error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.execute(`
            SELECT COUNT(*) as unreadCount 
            FROM messages 
            WHERE receiver_id = ? AND is_read = 0
        `, [userId]);
        
        res.json({ unreadCount: rows[0].unreadCount });
    } catch (error) {
        console.error('getUnreadCount error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export default { getContacts, getMessages, sendMessage, updateMessage, deleteMessage, getUnreadCount };
