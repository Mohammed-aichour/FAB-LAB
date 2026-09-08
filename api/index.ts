const app = require('../backend/dist/src/app').default || require('../backend/dist/src/app');

export default function handler(req: any, res: any) {
  return app(req, res);
}
