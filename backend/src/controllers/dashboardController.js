const LoginEvent = require('../models/LoginEvent');
const User = require('../models/User');

async function getRecentEvents(req, res) {
  try {
    const events = await LoginEvent.find()
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getFlaggedEvents(req, res) {
  try {
    const events = await LoginEvent.find({ flagged: true })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getStats(req, res) {
  try {
    const total       = await LoginEvent.countDocuments();
    const failed      = await LoginEvent.countDocuments({ success: false });
    const flagged     = await LoginEvent.countDocuments({ flagged: true });
    const lockedUsers = await User.countDocuments({ isLocked: true });

    // top 5 risky IPs
    const riskyIPs = await LoginEvent.aggregate([
      { $match: { success: false } },
      { $group: { _id: '$ip', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // top 5 high risk users
    const riskyUsers = await User.find()
      .sort({ riskScore: -1 })
      .limit(5)
      .select('username email riskScore isLocked');

    res.json({ total, failed, flagged, lockedUsers, riskyIPs, riskyUsers });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await User.find()
      .select('username email role riskScore isLocked createdAt')
      .sort({ riskScore: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function unlockUser(req, res) {
  try {
    const { username } = req.params;
    await User.findOneAndUpdate({ username }, { isLocked: false, lockedUntil: null, riskScore: 0 });
    res.json({ message: `User ${username} unlocked successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { getRecentEvents, getFlaggedEvents, getStats, getAllUsers, unlockUser };
