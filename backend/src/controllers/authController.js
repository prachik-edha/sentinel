const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginEvent = require('../models/LoginEvent');
const { getGeoInfo } = require('../utils/geoip');
const { runDetection } = require('../utils/detection');

function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  );
}

async function register(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields required' });

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing)
      return res.status(409).json({ message: 'Username or email already exists' });

    const user = await User.create({ username, email, password });
    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';

    const user = await User.findOne({ username });

    // check if account is locked
    if (user?.isLocked) {
      if (user.lockedUntil && new Date() > user.lockedUntil) {
        // unlock if lock period has passed
        await User.findByIdAndUpdate(user._id, { isLocked: false, lockedUntil: null });
      } else {
        await LoginEvent.create({ username, ip, success: false, userAgent, flagged: true, flagReason: 'Account locked' });
        return res.status(423).json({ message: 'Account is temporarily locked due to suspicious activity' });
      }
    }

    const isValid = user && await user.comparePassword(password);
    const geo = await getGeoInfo(ip);
    const { flagged, flagReason } = await runDetection(username, ip, isValid);

    await LoginEvent.create({
      username,
      ip,
      success: isValid,
      country: geo.country,
      city: geo.city,
      userAgent,
      flagged,
      flagReason,
    });

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { username: user.username, email: user.email, role: user.role, riskScore: user.riskScore },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { register, login };
