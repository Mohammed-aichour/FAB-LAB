import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';

const router = Router();
const docDir = path.join(__dirname, '../../../Documents_GED');
const metadataFile = path.join(docDir, 'metadata.json');

// Reusable account
let testAccount: any = null;
async function getTransporter() {
  // If real SMTP credentials are provided in .env
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Fallback to Ethereal for testing
  if (!testAccount) {
    testAccount = await nodemailer.createTestAccount();
  }
  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
}

router.post('/generate-invoice', async (req, res) => {
  const { supplierName, supplierEmail, partName, category, description, quantity, unitPrice, deliveryAddress, contactPhone, urgency, orderRef, sendEmail, customEmailMessage } = req.body;

  if (!supplierName || !partName || !quantity || !unitPrice) {
    return res.status(400).json({ error: 'Tous les champs obligatoires sont requis.' });
  }

  const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
  const total = parseFloat(quantity) * parseFloat(unitPrice);
  
  // Safe filename
  const fileName = `Facture_Commande_${supplierName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  const filePath = path.join(docDir, fileName);

  try {
    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // PDF Content
    doc.fontSize(20).font('Helvetica-Bold').text('FACTURE DE COMMANDE', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).font('Helvetica').text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
    doc.moveDown();

    doc.font('Helvetica-Bold').text('Informations du Fournisseur :');
    doc.font('Helvetica').text(`Nom : ${supplierName}`);
    if (supplierEmail) doc.text(`Email : ${supplierEmail}`);
    doc.moveDown();

    doc.font('Helvetica-Bold').text('Détails de la commande :');
    doc.font('Helvetica');
    if (orderRef) doc.text(`Référence Commande : ${orderRef}`);
    doc.text(`Pièce demandée : ${partName}`);
    if (category) doc.text(`Catégorie : ${category}`);
    if (description) doc.text(`Description : ${description}`);
    doc.text(`Quantité : ${quantity}`);
    doc.text(`Prix unitaire : ${unitPrice} €`);
    doc.moveDown();

    doc.font('Helvetica-Bold').text('Informations de Livraison :');
    doc.font('Helvetica');
    if (deliveryAddress) doc.text(`Adresse : ${deliveryAddress}`);
    if (contactPhone) doc.text(`Contact : ${contactPhone}`);
    if (urgency) doc.text(`Urgence : ${urgency}`);
    doc.moveDown();

    doc.font('Helvetica-Bold').fontSize(14).text(`Total à régler : ${total.toFixed(2)} €`, { align: 'right' });

    doc.end();

    // When PDF is written, update metadata and send email
    writeStream.on('finish', async () => {
      let metadata: any = {};
      if (fs.existsSync(metadataFile)) {
        metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
      }

      metadata[fileName] = {
        title: `Commande: ${partName} (${supplierName})`,
        type: 'Facture / Garantie',
        machine: 'Générale',
        date: new Date().toLocaleDateString('en-US')
      };

      fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

      let previewUrl = '';
      
      // Send Email with Nodemailer ONLY IF sendEmail is true
      if (sendEmail) {
        try {
        const transporter = await getTransporter();
        const targetEmail = supplierEmail || 'fournisseur@example.com';
        
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Nouvelle Commande de Pièce</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">FabLab GMAO - ${orderRef || 'URGENTE'}</p>
            </div>
            <div style="padding: 20px; background-color: #ffffff; color: #374151;">
              <p>Bonjour <strong>${supplierName}</strong>,</p>
              
              ${customEmailMessage ? `<div style="padding: 15px; border-left: 4px solid #3b82f6; background-color: #eff6ff; margin: 20px 0; border-radius: 4px; font-style: italic; color: #1e40af;">"${customEmailMessage.replace(/\n/g, '<br/>')}"</div>` : ''}

              <p>Veuillez trouver ci-joint notre bon de commande officiel au format PDF pour la pièce suivante :</p>
              
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1f2937;">Détails de la pièce</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li><strong>Désignation :</strong> ${partName}</li>
                  <li><strong>Catégorie :</strong> ${category || 'N/A'}</li>
                  <li><strong>Quantité :</strong> ${quantity}</li>
                  <li><strong>Prix unitaire :</strong> ${unitPrice} €</li>
                </ul>
                ${description ? `<p style="margin-top: 10px;"><strong>Spécifications :</strong><br/>${description}</p>` : ''}
              </div>

              <div style="background-color: #fffbeb; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #fde68a;">
                <h3 style="margin-top: 0; color: #92400e;">Livraison & Contact</h3>
                <p style="margin: 0;"><strong>Urgence :</strong> ${urgency || 'Normale'}</p>
                <p style="margin: 5px 0 0 0;"><strong>Adresse :</strong> ${deliveryAddress || 'N/A'}</p>
                <p style="margin: 5px 0 0 0;"><strong>Contact :</strong> ${contactPhone || 'N/A'}</p>
              </div>

              <p>Merci de nous confirmer la bonne réception de cette commande et de nous indiquer les délais de livraison estimés.</p>
              <p>Cordialement,<br/><strong>L'équipe FabLab GMAO</strong></p>
            </div>
            <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              Ceci est un email automatique généré par le système GMAO.
            </div>
          </div>
        `;

        const info = await transporter.sendMail({
          from: process.env.SMTP_USER || '"FabLab GMAO" <gmao@fablab.com>',
          to: targetEmail,
          subject: `Commande [${orderRef || 'URGENTE'}] - ${partName}`,
          html: htmlContent,
          attachments: [
            {
              filename: fileName,
              path: filePath
            }
          ]
        });

        previewUrl = nodemailer.getTestMessageUrl(info) || '';
      } catch (emailErr) {
        console.error('Email failed:', emailErr);
      }
      } // End if sendEmail

      res.status(200).json({ 
        message: 'Facture générée avec succès', 
        fileName, 
        title: metadata[fileName].title,
        previewUrl 
      });
    });

  } catch (err) {
    console.error('Error generating invoice:', err);
    res.status(500).json({ error: 'Erreur lors de la génération de la facture' });
  }
});

export default router;
