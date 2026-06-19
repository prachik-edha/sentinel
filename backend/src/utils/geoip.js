const axios = require('axios');

async function getGeoInfo(ip) {
  try {
    // skip lookup for localhost
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
      return { country: 'Local', city: 'Local' };
    }
    const res = await axios.get(`http://ip-api.com/json/${ip}?fields=country,city,status`, { timeout: 3000 });
    if (res.data.status === 'success') {
      return { country: res.data.country, city: res.data.city };
    }
    return { country: 'Unknown', city: 'Unknown' };
  } catch {
    return { country: 'Unknown', city: 'Unknown' };
  }
}

module.exports = { getGeoInfo };
