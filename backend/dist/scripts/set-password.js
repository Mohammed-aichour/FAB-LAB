"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const json_store_1 = require("../services/json-store");
// Password read from stdin, never a command-line argument or log.
async function main() {
    const email = process.argv[2];
    const user = (0, json_store_1.readEntity)('users').find(u => u.email === email);
    if (!user)
        throw new Error('Utilisateur existant requis : npm run user:password -- email');
    process.stdout.write('Mot de passe via entrée standard (12 caractères minimum) :\n');
    let password = '';
    for await (const chunk of process.stdin)
        password += chunk;
    password = password.trim();
    if (password.length < 12)
        throw new Error('12 caractères minimum.');
    const credentials = (0, json_store_1.readEntity)('credentials').filter(c => c.userId !== String(user.id));
    (0, json_store_1.writeEntity)('credentials', [...credentials, { userId: String(user.id), hash: await bcryptjs_1.default.hash(password, 12) }]);
    console.log('Mot de passe enregistré.');
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
