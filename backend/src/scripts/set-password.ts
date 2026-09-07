import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { readEntity, writeEntity } from '../services/json-store';
// Password read from stdin, never a command-line argument or log.
async function main() {
  const email = process.argv[2];
  const user = readEntity<any[]>('users').find(u => u.email === email);
  if (!user) throw new Error('Utilisateur existant requis : npm run user:password -- email');
  process.stdout.write('Mot de passe via entrée standard (12 caractères minimum) :\n');
  let password = '';
  for await (const chunk of process.stdin) password += chunk;
  password = password.trim();
  if (password.length < 12) throw new Error('12 caractères minimum.');
  const credentials = readEntity<any[]>('credentials').filter(c => c.userId !== String(user.id));
  writeEntity('credentials',[...credentials,{userId:String(user.id),hash:await bcrypt.hash(password,12)}]);
  console.log('Mot de passe enregistré.');
}
main().catch(e => { console.error(e.message); process.exitCode=1; });
