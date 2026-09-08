"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const app = require('../dist/src/app').default || require('../dist/src/app');
function handler(req, res) {
    return app(req, res);
}
