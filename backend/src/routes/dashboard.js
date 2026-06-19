const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const {
  getRecentEvents,
  getFlaggedEvents,
  getStats,
  getAllUsers,
  unlockUser,
} = require('../controllers/dashboardController');

router.use(authMiddleware);

router.get('/events/recent',  getRecentEvents);
router.get('/events/flagged', getFlaggedEvents);
router.get('/stats',          getStats);
router.get('/users',          adminOnly, getAllUsers);
router.patch('/users/:username/unlock', adminOnly, unlockUser);

module.exports = router;
