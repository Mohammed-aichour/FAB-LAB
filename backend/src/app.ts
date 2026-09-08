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

app.use((req, res, next) => {
  const vercelUri = req.headers['x-forwarded-uri'] as string | undefined;
  if (vercelUri && typeof vercelUri === 'string' && vercelUri.startsWith('/')) {
    req.url = vercelUri;
  }
  next();
});

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

app.get(['/', '/api', '/health', '/api/health'], (req, res) => {
  res.json({ status: 'ok', message: 'GMAO FabLab API Server is running', timestamp: new Date().toISOString() });
});

app.use(['/auth', '/api/auth'], authRoutes);
app.use(['/assistant', '/api/assistant'], assistantRoutes);
app.use(['/db', '/api/db'], databaseRoutes);

app.use(['/machines', '/api/machines'], authenticate, (req, res, next) => req.method === 'GET' ? next() : requireRoles('Superviseur', 'Ingénieur', 'Technicien')(req, res, next), machineRoutes);
app.use(['/suppliers', '/api/suppliers'], authenticate, (req, res, next) => req.method === 'GET' ? next() : requireRoles('Superviseur', 'Ingénieur', 'Technicien')(req, res, next), supplierRoutes);
app.use(['/interventions', '/api/interventions'], authenticate, (req, res, next) => req.method === 'GET' ? next() : requireRoles('Superviseur', 'Ingénieur', 'Technicien')(req, res, next), interventionRoutes);
app.use(['/documents', '/api/documents'], authenticate, (req, res, next) => req.method === 'GET' ? next() : requireRoles('Superviseur', 'Ingénieur', 'Technicien')(req, res, next), documentRoutes);
app.use(['/orders', '/api/orders'], authenticate, (req, res, next) => req.method === 'GET' ? next() : requireRoles('Superviseur', 'Ingénieur', 'Technicien')(req, res, next), orderRoutes);
app.use('/api', emailRoutes);

app.use('/docs', express.static(path.join(__dirname, '../../Documents_GED')));

if (require.main === module) {
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
