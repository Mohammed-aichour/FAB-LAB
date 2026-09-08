let app;
try {
  app = require('./backend/src/app').default || require('./backend/src/app');
} catch (e) {
  app = require('./backend/dist/src/app').default || require('./backend/dist/src/app');
}

module.exports = (req, res) => app(req, res);
