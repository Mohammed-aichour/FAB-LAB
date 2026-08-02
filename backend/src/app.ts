import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, '../../data_db');

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

import machineRoutes from './routes/machine.routes';
import supplierRoutes from './routes/supplier.routes';
import interventionRoutes from './routes/intervention.routes';
import documentRoutes from './routes/document.routes';
import orderRoutes from './routes/order.routes';
import emailRoutes from './routes/email.routes';

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GMAO API is running' });
});

// ── Universal DB persistence route ──────────────────────────────────────────
app.get('/api/db/:entity', (req, res) => {
  const { entity } = req.params;
  const filePath = path.join(DATA_DIR, `${entity}_db.json`);
  try {
    if (!fs.existsSync(filePath)) return res.json([]);
    const raw = fs.readFileSync(filePath, 'utf8');
    res.json(JSON.parse(raw));
  } catch (err) {
    console.error(`[DB GET] Error reading ${entity}:`, err);
    res.status(500).json({ error: 'Read error' });
  }
});

app.post('/api/db/:entity', (req, res) => {
  const { entity } = req.params;
  const filePath = path.join(DATA_DIR, `${entity}_db.json`);
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ success: true, entity, count: Array.isArray(req.body) ? req.body.length : 1 });
  } catch (err) {
    console.error(`[DB POST] Error writing ${entity}:`, err);
    res.status(500).json({ error: 'Write error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────

app.use('/api/machines', machineRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', emailRoutes);

app.use('/docs', express.static(path.join(__dirname, '../../Documents_GED')));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
