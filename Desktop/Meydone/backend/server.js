import 'dotenv/config';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { env } from './src/config/env.js';
import { ensureSampleData } from './src/seed/ensureSampleData.js';

const start = async () => {
  await connectDB();
  await ensureSampleData();
  const host = process.env.HOST ?? '0.0.0.0';
  const server = app.listen(env.port, host, () => {
    console.log(`API: http://127.0.0.1:${env.port}/api/health (${env.nodeEnv})`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `\nPort ${env.port} kullanımda. O portu kullanan programı kapatın veya backend/.env içinde PORT=4001 yazın.\n`,
      );
      process.exit(1);
    }
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
