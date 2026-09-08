const app = require('../dist/src/app').default || require('../dist/src/app');

export default function handler(req: any, res: any) {
  return app(req, res);
}
