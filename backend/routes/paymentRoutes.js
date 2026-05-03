import express from 'express';
import { 
    listPaymentMethods, 
    createPaymentMethod, 
    updatePaymentMethod, 
    deletePaymentMethod, 
    setUserPayment,
    getFarmerMonthlySummary,
    initiatePayoutRequest,
    listPayoutRequests,
    updatePayoutStatus
} from '../controllers/paymentController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public: list active methods
router.get('/methods', listPaymentMethods);

// Admin: manage methods
router.post('/methods', createPaymentMethod);
router.put('/methods/:id', updatePaymentMethod);
router.delete('/methods/:id', deletePaymentMethod);

// User: set own payment preference
router.post('/me', authenticateToken, setUserPayment);

// Farmer: Monthly Payouts
router.get('/farmer-monthly-summary', authenticateToken, requireRole('farmer'), getFarmerMonthlySummary);
router.post('/request-payout', authenticateToken, requireRole('farmer'), initiatePayoutRequest);

// Management: Payout Requests
router.get('/requests', authenticateToken, requireRole('admin', 'collector'), listPayoutRequests);
router.put('/requests/:id/status', authenticateToken, requireRole('admin', 'collector'), updatePayoutStatus);

export default router;
