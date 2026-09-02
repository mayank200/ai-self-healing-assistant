import express from 'express';
import { getProductsByTag } from '../services/productService.js';

const router = express.Router();

// GET /api/products/search?tag=electronics
router.get('/search', (req, res, next) => {
  try {
    const { tag } = req.query;
    const products = getProductsByTag(tag);
    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
});

export default router;
