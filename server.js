const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const ayseRoutes = require('./ayse-app/routes/ayseRoutes');
const iremRoutes = require('./irem-app/routes/iremRoutes');
const sudeRoutes = require('./sude-app/routes/sudeRoutes');
const cerenRoutes = require('./ceren-app/routes/cerenRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', ayseRoutes);
app.use('/api/irem', iremRoutes);
app.use('/api/sude', sudeRoutes);
app.use('/api/ceren', cerenRoutes);

app.get('/health', (req, res) => {
  res.json({ ok: true, mongo: mongoose.connection.readyState });
});

// MongoDB: mongoose.connect(process.env.MONGODB_URI);

app.listen(PORT, () => {
  console.log(
    `Sunucu http://127.0.0.1:${PORT} (Ayşe: /api, İrem: /api/irem, Sude: /api/sude, Ceren: /api/ceren)`
  );
});
