import 'dotenv/config';
import express from 'express'; // Express'i import et (CORS eklemek için gerekebilir)
import cors from 'cors'; // Yeni yüklediğin paketi import et
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { env } from './src/config/env.js';
import { ensureSampleData } from './src/seed/ensureSampleData.js';

// --- CORS AYARI BURAYA GELİYOR ---
// Eğer src/app.js içinde halihazırda cors() eklemediysen buraya ekle:
app.use(cors({
  origin: "http://localhost:3000", // Frontend adresin
  credentials: true
}));
// --------------------------------

const start = async () => {
  try {
    await connectDB();
    await ensureSampleData();
    
    // Docker konteyneri dışından erişim için 0.0.0.0 şarttır.
    const host = process.env.HOST ?? '0.0.0.0'; 
    
    const server = app.listen(env.port, host, () => {
      console.log(`\n🚀 Sunucu Hazır!`);
      console.log(`📡 API: http://localhost:${env.port}/api/health`);
      console.log(`🌍 Mod: ${env.nodeEnv}\n`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `\nPort ${env.port} kullanımda. Başka bir port deneyin.\n`,
        );
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('Sunucu başlatılırken hata oluştu:', err);
    process.exit(1);
  }
};

start();