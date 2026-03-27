import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '8mb' }));

app.get('/', (req, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"><title>API</title></head>
<body style="font-family:system-ui;max-width:40rem;margin:2rem;line-height:1.5">
  <h1>Backend API çalışıyor</h1>
  <p>Bu proje yalnızca <strong>REST API</strong> sunar. Tarayıcıdan tıklanacak bir &quot;giriş sayfası&quot; yok; giriş için ayrı bir <strong>frontend</strong> (React, Vue vb.) veya <strong>Postman / Thunder Client</strong> kullanılmalı.</p>
  <p><a href="/api/health">Durum kontrolü: GET /api/health</a></p>
  <h2>Örnek adresler</h2>
  <ul>
    <li><code>POST /auth/register</code> veya <code>POST /api/auth/register</code></li>
    <li><code>POST /auth/login</code> veya <code>POST /api/auth/login</code></li>
  </ul>
  <p><strong>localhost açılmıyorsa:</strong> Proje klasöründe <code>npm run dev</code> çalıştırın, <code>.env</code> içindeki <code>PORT</code> (varsayılan 4000) ile adresi açın: <code>http://localhost:4000</code>. MongoDB&apos;nin çalışıyor olması gerekir.</p>
</body>
</html>`);
});

app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
