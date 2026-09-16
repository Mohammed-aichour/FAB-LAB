"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversation = getConversation;
exports.chat = chat;
const crypto_1 = __importDefault(require("crypto"));
const json_store_1 = require("./json-store");
const assistant_service_1 = require("./assistant.service");
const busy = new Set();
function getConversation(id, user) {
    const c = (0, json_store_1.readEntity)('assistant_conversations').find(c => c.id === id && c.userId === String(user.id));
    if (!c || Date.now() - c.updatedAt > 24 * 3600_000)
        throw new Error('Conversation expirée ou inaccessible.');
    return c;
}
async function chat(message, id, user) {
    const key = String(user.id);
    if (busy.has(key))
        throw new Error('Une demande est déjà en cours.');
    busy.add(key);
    try {
        const c = id ? getConversation(id, user) : { id: crypto_1.default.randomUUID(), userId: key, messages: [], updatedAt: Date.now() };
        const messages = [...c.messages, { role: 'user', content: message }];
        const result = await (0, assistant_service_1.runAssistant)(messages, user);
        c.messages = [...messages, { role: 'assistant', content: result.message + (result.pendingAction ? '\nAction proposée : ' + JSON.stringify({ summary: result.pendingAction.summary, details: result.pendingAction.newValue }) : '') }].slice(-24);
        c.updatedAt = Date.now();
        const list = (0, json_store_1.readEntity)('assistant_conversations').filter(x => x.id !== c.id && Date.now() - x.updatedAt < 24 * 3600_000);
        (0, json_store_1.writeEntity)('assistant_conversations', [c, ...list].slice(0, 500));
        return { ...result, conversationId: c.id };
    }
    finally {
        busy.delete(key);
    }
}
