import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

const v1Router = Router();
v1Router.use('/auth', authRoutes);
v1Router.use('/', routes);

app.use(helmet());
app.use(
  cors({
  
    origin: true, // Her yerden gelen isteğe izin ver (iPhone, Vercel, Railway)
    credentials: true,
  }),
);
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '8mb' }));

app.get('/', (req, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"><title>Meydone API</title></head>
<body style="font-family:system-ui;max-width:42rem;margin:2rem;line-height:1.55">
  <h1>Meydone API</h1>
  <p>React arayüzü: <strong><a href="http://127.0.0.1:5173">http://127.0.0.1:5173</a></strong> — proje kökünde <code>npm run dev</code></p>
  <p><a href="/api/health">GET /api/health</a> (varsayılan API portu .env içindeki <code>PORT</code>)</p>
</body>
</html>`);
});

app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', routes);
app.use('/v1/auth', authRoutes);
app.use('/v1', v1Router);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
