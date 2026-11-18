const mongoose = require('mongoose');
const { mongoUri } = require('./env');

let connected = false;

async function connectDB() {
  if (connected) return;
  await mongoose.connect(mongoUri);
  connected = true;
  console.log(`✅  MongoDB connected → ${mongoose.connection.name}`);
}

module.exports = { connectDB };
