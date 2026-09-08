let app;
try {
  app = require('./src/app').default || require('./src/app');
} catch (e) {
  app = require('./dist/src/app').default || require('./dist/src/app');
}

module.exports = (req, res) => app(req, res);
