"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disabledEmailProvider = void 0;
// Enable only after implementing a dedicated, user-bound send confirmation and an outbox.
exports.disabledEmailProvider = {
    async send() { throw new Error('Envoi fournisseur non configuré. Le message reste un brouillon.'); },
};
