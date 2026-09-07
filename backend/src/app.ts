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

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map(value => value.trim());
app.use(cors({ origin: (origin, done) => !origin || allowedOrigins.includes(origin) ? done(null, true) : done(new Error('Origine refusée.')) }));
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

app.use('/api/auth', authRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/db', databaseRoutes);
app.use('/api', authenticate);
app.use('/api', (req, res, next) => req.method === 'GET' ? next() : requireRoles('Superviseur', 'Ingénieur', 'Technicien')(req, res, next));

app.use('/api/machines', machineRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', emailRoutes);

app.use('/docs', express.static(path.join(__dirname, '../../Documents_GED')));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
