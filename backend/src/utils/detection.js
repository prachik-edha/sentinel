const LoginEvent = require('../models/LoginEvent');
const User = require('../models/User');

const BRUTE_FORCE_LIMIT = 5;       // max failed attempts
const BRUTE_FORCE_WINDOW = 60000;  // 1 minute in ms
const IP_MULTI_ACCOUNT_LIMIT = 10; // max accounts from same IP in 1 hour

async function runDetection(username, ip, success) {
  const now = new Date();
  let flagged = false;
  let flagReason = '';

  // 1. Brute force detection — 5+ failed attempts in 60 seconds
  if (!success) {
    const windowStart = new Date(now - BRUTE_FORCE_WINDOW);
    const recentFails = await LoginEvent.countDocuments({
      username,
      success: false,
      ip,
      createdAt: { $gte: windowStart },
    });

    if (recentFails >= BRUTE_FORCE_LIMIT) {
      flagged = true;
      flagReason = `Brute force detected: ${recentFails + 1} failed attempts in 60s`;

      // lock the user account for 15 minutes
      await User.findOneAndUpdate(
        { username },
        { isLocked: true, lockedUntil: new Date(now.getTime() + 15 * 60 * 1000) }
      );
    }
  }

  // 2. IP multi-account detection — same IP hitting 10+ different accounts in 1 hour
  if (!flagged) {
    const oneHourAgo = new Date(now - 3600000);
    const uniqueAccountsFromIP = await LoginEvent.distinct('username', {
      ip,
      createdAt: { $gte: oneHourAgo },
    });

    if (uniqueAccountsFromIP.length >= IP_MULTI_ACCOUNT_LIMIT) {
      flagged = true;
      flagReason = `IP scanning: ${uniqueAccountsFromIP.length} accounts targeted from same IP`;
    }
  }

  // 3. Update user risk score
  if (flagged) {
    await User.findOneAndUpdate(
      { username },
      { $inc: { riskScore: 10 } }
    );
  } else if (!success) {
    await User.findOneAndUpdate(
      { username },
      { $inc: { riskScore: 2 } }
    );
  }

  return { flagged, flagReason };
}

module.exports = { runDetection };
