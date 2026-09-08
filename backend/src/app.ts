import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import assistantRoutes from './routes/assistant.routes';
import databaseRoutes from './routes/database.routes';
import { authenticate, requireRoles } from './middleware/auth';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://mohammed-aichour.github.io'];
const envOrigins = [process.env.FRONTEND_URL, process.env.FRONTEND_ORIGIN, process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '']
  .filter(Boolean)
  .flatMap(val => (val || '').split(','))
  .map(value => value.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(cors({
  origin: (origin, done) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      done(null, true);
    } else {
      done(new Error('Origine refusée par la politique CORS.'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Data-Revision']
}));
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

app.get(['/health', '/api/health'], (req, res) => {
  res.json({ status: 'ok', message: 'GMAO API is running' });
});

app.use(['/auth', '/api/auth'], authRoutes);
app.use(['/assistant', '/api/assistant'], assistantRoutes);
app.use(['/db', '/api/db'], databaseRoutes);
app.use(['/', '/api'], authenticate);
app.use(['/', '/api'], (req, res, next) => req.method === 'GET' ? next() : requireRoles('Superviseur', 'Ingénieur', 'Technicien')(req, res, next));

app.use(['/machines', '/api/machines'], machineRoutes);
app.use(['/suppliers', '/api/suppliers'], supplierRoutes);
app.use(['/interventions', '/api/interventions'], interventionRoutes);
app.use(['/documents', '/api/documents'], documentRoutes);
app.use(['/orders', '/api/orders'], orderRoutes);
app.use(['/', '/api'], emailRoutes);

app.use('/docs', express.static(path.join(__dirname, '../../Documents_GED')));

if (require.main === module) {
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
