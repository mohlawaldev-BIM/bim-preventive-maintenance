const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');
const assetRoutes = require('./routes/assets');
const workOrderRoutes = require('./routes/workOrders');
const cron = require('node-cron');
const { runMaintenanceCheck } = require('./engine/maintenanceEngine');
const exportRoutes = require('./routes/export');
const uploadRoutes = require('./routes/upload');
const projectRoutes = require('./routes/projects');


const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://bim-preventive-maintenance.vercel.app',
  ],
  credentials: true,
}

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/api/assets', assetRoutes);
app.use('/api/workorders', workOrderRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/projects', projectRoutes);

app.get('/', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ message: 'BIM Maintenance API is running!', db: 'Connected' });
  } catch (err) {
    res.json({ message: 'API running but DB failed', error: err.message });
  }
});

// Run once immediately when server starts
runMaintenanceCheck();

// Then run every day at midnight
cron.schedule('0 0 * * *', () => {
  runMaintenanceCheck();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});