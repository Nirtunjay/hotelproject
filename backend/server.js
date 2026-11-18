require('dotenv').config();
require('./src/config/env'); // validate env vars before anything else

const { connectDB } = require('./src/config/db');
const app = require('./src/app');
const { port } = require('./src/config/env');

connectDB()
  .then(() => {
    app.listen(port, () =>
      console.log(`🚀  StayEase API running → http://localhost:${port}`)
    );
  })
  .catch((err) => {
    console.error('❌  Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
