import 'dotenv/config';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { env } from './src/config/env.js';
import { ensureSampleData } from './src/seed/ensureSampleData.js';

const start = async () => {
  await connectDB();
  await ensureSampleData();
  app.listen(env.port, () => {
    const url = `http://localhost:${env.port}`;
    console.log(`Server listening on port ${env.port} (${env.nodeEnv})`);
    console.log(`Open in browser: ${url}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
