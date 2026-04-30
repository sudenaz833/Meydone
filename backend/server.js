import 'dotenv/config';
import express from 'express'; 
import cors from 'cors'; 
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { env } from './src/config/env.js';
import { ensureSampleData } from './src/seed/ensureSampleData.js';

// --- KRİTİK AYARLAR ---
//// Hem localhost hem de mobil cihazlardan gelen isteklere izin veriyoruz.
//app.use(cors({
  //origin: true, // Dinamik olarak tüm kaynaklara izin verir, kafa karışıklığını önler.
  //credentials: true
//}));

const start = async () => {
  try {
    await connectDB();
    await ensureSampleData();
    

    // Terminalde 9000 gördüğünü söylediğin için burayı sabitliyoruz.
    const port = process.env.PORT || 9000; 

    // 0.0.0.0: Sunucunun sadece PC içine değil, dış dünyaya (iPhone'a) yayın yapmasını sağlar.
    const host = '0.0.0.0'; 
    
  const server = app.listen(port, host, () => {
      console.log(`\n🚀 Meydone Backend Yayında!`);
      console.log(`📡 Dinamik Port: ${port}`);
      console.log(`🌍 Mod: ${env.nodeEnv}\n`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\nPort ${port} zaten kullanımda. Başka bir port deneyin.\n`);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('Sunucu başlatılırken hata oluştu:', err);
    process.exit(1);
  }
};

start();