import express from 'express';
import { calculateOrderTotal } from '../services/orderService.js';

const router = express.Router();

// POST /api/orders/calculate
router.post('/calculate', (req, res, next) => {
  try {
    const { items, discountRate, taxRate } = req.body;
    const summary = calculateOrderTotal(items, discountRate, taxRate);
    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

export default router;
