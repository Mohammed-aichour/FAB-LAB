"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendAudit = appendAudit;
const crypto_1 = __importDefault(require("crypto"));
const json_store_1 = require("./json-store");
function appendAudit(user, action, entity, entityId, oldValue, newValue, requestId = crypto_1.default.randomUUID()) {
    const logs = (0, json_store_1.readEntity)('audit_logs');
    const entry = {
        id: `audit_${crypto_1.default.randomUUID()}`,
        date: new Date().toISOString(),
        userId: String(user.id),
        user: user.name,
        role: user.role,
        action,
        entity,
        entityId,
        oldValue,
        newValue,
        requestId,
    };
    (0, json_store_1.writeEntity)('audit_logs', [entry, ...logs]);
    return entry;
}
