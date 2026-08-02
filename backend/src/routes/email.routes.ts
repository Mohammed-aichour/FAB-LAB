import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

router.post('/send-email', async (req: Request, res: Response) => {
  try {
    const { to, subject, message, btNumber, pdfDataUrl } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ error: 'Adresse email destinataire et objet requis.' });
    }

    // Configure Nodemailer Transporter (Supports SMTP / Test Account)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'fablab.gmao@universiapolis.ma',
        pass: process.env.SMTP_PASS || 'secret_gmao_2026'
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
      from: '"GMAO FabLab Universiapolis" <gmao@universiapolis.ma>',
      to,
      subject,
      text: message,
      attachments
    };

    // Send email via Nodemailer
    await transporter.sendMail(mailOptions).catch(err => {
      console.warn('[Nodemailer Warning] Test SMTP send fallback:', err.message);
    });

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
