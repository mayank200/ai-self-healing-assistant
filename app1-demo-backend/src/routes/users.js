import express from 'express';
import { getUserProfileById } from '../services/userService.js';

const router = express.Router();

// GET /api/users/:id/profile
router.get('/:id/profile', (req, res, next) => {
  try {
    const userId = req.params.id;
    const userProfile = getUserProfileById(userId);
    return res.status(200).json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    next(error);
  }
});

export default router;
