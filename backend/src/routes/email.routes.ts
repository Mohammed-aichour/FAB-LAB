import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { z } from 'zod';

const router = Router();

router.post('/send-email', async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ to: z.email(), subject: z.string().min(1).max(300), message: z.string().max(10000), btNumber: z.string().max(100).optional(), pdfDataUrl: z.string().max(1_500_000).optional(), confirm: z.literal(true) }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Données invalides ou confirmation explicite absente.' });
    const { to, subject, message, btNumber, pdfDataUrl } = parsed.data;

    if (!to || !subject) {
      return res.status(400).json({ error: 'Adresse email destinataire et objet requis.' });
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return res.status(503).json({error:'Service SMTP non configuré.'});
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const attachments: any[] = [];
    if (pdfDataUrl && pdfDataUrl.startsWith('data:application/pdf;base64,')) {
      const base64Data = pdfDataUrl.replace(/^data:application\/pdf;base64,/, '');
      attachments.push({
        filename: `Bon_de_Travail_${btNumber || 'GMAO'}.pdf`,
        content: Buffer.from(base64Data, 'base64'),
        contentType: 'application/pdf'
      });
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: message,
      attachments
    };

    // Send email via Nodemailer
    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: `Email transmis avec succès à ${to} avec la pièce jointe PDF ${btNumber}.pdf`
    });

  } catch (error: any) {
    console.error('Email send error:', error);
    res.status(500).json({ error: "Erreur lors de l'envoi de l'email." });
  }
});

export default router;
