const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

let connected = false;

async function connectDB() {
  if (connected) return;
  await mongoose.connect(MONGO_URI);
  connected = true;
  console.log(`✅  MongoDB connected → ${mongoose.connection.name}`);
}

module.exports = { connectDB };
