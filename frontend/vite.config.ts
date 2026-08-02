import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import fs from "fs"

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-ged-docs',
      configureServer(server) {
        server.middlewares.use('/docs', (req, res, next) => {
          const docDir = path.resolve(__dirname, '../Documents_GED');
          const rawUrl = req.url || '';
          const rawFileName = decodeURIComponent(rawUrl.split('?')[0]).replace(/^\//, '');
          const filePath = path.join(docDir, rawFileName);

          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            let contentType = 'application/octet-stream';
            if (ext === '.pdf') contentType = 'application/pdf';
            else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            else if (ext === '.xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            else if (ext === '.json') contentType = 'application/json';
            else if (ext === '.png') contentType = 'image/png';
            else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(rawFileName)}"`);
            res.setHeader('Access-Control-Allow-Origin', '*');
            fs.createReadStream(filePath).pipe(res);
          } else {
            next();
          }
        });
      }
    },
    {
      name: 'gmao-json-db',
      configureServer(server) {
        const dbDir = path.resolve(__dirname, '../data_db');
        if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

        server.middlewares.use('/api/db', (req, res, next) => {
          const rawUrl = req.url || '';
          const entity = rawUrl.split('?')[0].replace(/^\//, '').split('/')[0];
          if (!entity) return next();

          const filePath = path.join(dbDir, `${entity}_db.json`);

          if (req.method === 'GET') {
            if (fs.existsSync(filePath)) {
              const content = fs.readFileSync(filePath, 'utf8');
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(content);
            } else {
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify([]));
            }
            return;
          }

          if (req.method === 'POST' || req.method === 'PUT') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                fs.writeFileSync(filePath, body, 'utf8');
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({ success: true, message: `Database ${entity} updated on disk.` }));
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: String(err) }));
              }
            });
            return;
          }

          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api/express': 'http://127.0.0.1:5000',
    }
  }
})
