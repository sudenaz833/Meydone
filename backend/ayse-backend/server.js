const express = require('express');
const mongoose = require('mongoose');
const ayseRoutes = require('./routes/ayseRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api', ayseRoutes);

app.get('/health', (req, res) => {
  res.json({ ok: true, mongo: mongoose.connection.readyState });
});

// MongoDB bağlantısı henüz kurulmadı — aşağıdaki satırı .env ile URI tanımlayınca açın:
// mongoose.set('strictQuery', true);
// await mongoose.connect(process.env.MONGODB_URI);

app.listen(PORT, () => {
  console.log(`Sunucu http://127.0.0.1:${PORT} (API: /api)`);
});
