"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const assistant_routes_1 = __importDefault(require("./routes/assistant.routes"));
const database_routes_1 = __importDefault(require("./routes/database.routes"));
const auth_1 = require("./middleware/auth");
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((req, res, next) => {
    const vercelPath = (req.headers['x-forwarded-uri'] || req.headers['x-matched-path']);
    if (vercelPath && typeof vercelPath === 'string' && vercelPath.startsWith('/')) {
        req.url = vercelPath;
    }
    else if (req.url === '/api' && req.originalUrl && req.originalUrl !== '/api') {
        req.url = req.originalUrl;
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
app.use((0, cors_1.default)({
    origin: (origin, done) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
            done(null, true);
        }
        else {
            done(new Error('Origine refusée par la politique CORS.'));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Data-Revision']
}));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
const machine_routes_1 = __importDefault(require("./routes/machine.routes"));
const supplier_routes_1 = __importDefault(require("./routes/supplier.routes"));
const intervention_routes_1 = __importDefault(require("./routes/intervention.routes"));
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const email_routes_1 = __importDefault(require("./routes/email.routes"));
app.get(['/', '/api', '/health', '/api/health'], (req, res) => {
    res.json({ status: 'ok', message: 'GMAO FabLab API Server is running', timestamp: new Date().toISOString() });
});
app.use(['/auth', '/api/auth'], auth_routes_1.default);
app.use(['/assistant', '/api/assistant'], assistant_routes_1.default);
app.use(['/db', '/api/db'], database_routes_1.default);
app.use(['/machines', '/api/machines'], auth_1.authenticate, (req, res, next) => req.method === 'GET' ? next() : (0, auth_1.requireRoles)('Superviseur', 'Ingénieur', 'Technicien')(req, res, next), machine_routes_1.default);
app.use(['/suppliers', '/api/suppliers'], auth_1.authenticate, (req, res, next) => req.method === 'GET' ? next() : (0, auth_1.requireRoles)('Superviseur', 'Ingénieur', 'Technicien')(req, res, next), supplier_routes_1.default);
app.use(['/interventions', '/api/interventions'], auth_1.authenticate, (req, res, next) => req.method === 'GET' ? next() : (0, auth_1.requireRoles)('Superviseur', 'Ingénieur', 'Technicien')(req, res, next), intervention_routes_1.default);
app.use(['/documents', '/api/documents'], auth_1.authenticate, (req, res, next) => req.method === 'GET' ? next() : (0, auth_1.requireRoles)('Superviseur', 'Ingénieur', 'Technicien')(req, res, next), document_routes_1.default);
app.use(['/orders', '/api/orders'], auth_1.authenticate, (req, res, next) => req.method === 'GET' ? next() : (0, auth_1.requireRoles)('Superviseur', 'Ingénieur', 'Technicien')(req, res, next), order_routes_1.default);
app.use('/api', email_routes_1.default);
app.use('/docs', express_1.default.static(path_1.default.join(__dirname, '../../Documents_GED')));
if (require.main === module) {
    app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
exports.default = app;
