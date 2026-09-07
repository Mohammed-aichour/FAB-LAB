export interface SupplierEmail { to: string; subject: string; body: string }
export interface EmailProvider { send(message: SupplierEmail, idempotencyKey: string): Promise<{ messageId: string }> }
// Enable only after implementing a dedicated, user-bound send confirmation and an outbox.
export const disabledEmailProvider: EmailProvider = {
  async send() { throw new Error('Envoi fournisseur non configuré. Le message reste un brouillon.'); },
};
