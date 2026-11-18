const { customAlphabet } = require('nanoid');

// 6 uppercase alphanum characters → 36^6 ≈ 2 billion combinations; collision risk negligible at this scale
const alpha = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

const hotelRef      = () => `HTL-${new Date().getFullYear()}-${alpha()}`;
const restaurantRef = () => `RST-${new Date().getFullYear()}-${alpha()}`;

module.exports = { hotelRef, restaurantRef };
