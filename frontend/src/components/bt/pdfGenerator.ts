import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { BTItem } from './types';

export const generateBTPdf = async (bt: BTItem): Promise<string> => {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 Size: 210mm x 297mm in points
  const { width, height } = page.getSize();

  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const primaryBlue = rgb(0.12, 0.44, 0.85); // FabLab Blue
  const darkGray = rgb(0.15, 0.15, 0.18);
  const lightGray = rgb(0.95, 0.96, 0.98);
  const borderGray = rgb(0.80, 0.82, 0.86);

  // 1. Header Banner Box
  page.drawRectangle({
    x: 35,
    y: height - 90,
    width: width - 70,
    height: 60,
    color: primaryBlue,
  });

  page.drawText("GMA LAB — WORK ORDER SYSTEM", {
    x: 50,
    y: height - 55,
    size: 12,
    font: fontHelveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("DOSSIER TECHNIQUE DE BON DE TRAVAIL & ORDRE D'INTERVENTION", {
    x: 50,
    y: height - 73,
    size: 9,
    font: fontHelvetica,
    color: rgb(0.9, 0.95, 1),
  });

  page.drawText(`BT: ${bt.btNumber}`, {
    x: width - 210,
    y: height - 53,
    size: 12,
    font: fontHelveticaBold,
    color: rgb(1, 0.9, 0.2), // Yellow Accent
  });

  page.drawText(`OT: ${bt.otNumber || 'OT-2026-001'}`, {
    x: width - 210,
    y: height - 67,
    size: 10,
    font: fontHelveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`STATUT: ${bt.status.toUpperCase()}`, {
    x: width - 210,
    y: height - 81,
    size: 8,
    font: fontHelveticaBold,
    color: rgb(0.9, 1, 0.9),
  });

  let currentY = height - 105;

  const drawRow = (label1: string, val1: string, label2: string, val2: string) => {
    page.drawRectangle({
      x: 35,
      y: currentY - 22,
      width: 255,
      height: 22,
      color: lightGray,
      borderColor: borderGray,
      borderWidth: 0.5,
    });
    page.drawText(`${label1}:`, { x: 40, y: currentY - 15, size: 7.5, font: fontHelveticaBold, color: darkGray });
    page.drawText(String(val1 || '—'), { x: 115, y: currentY - 15, size: 7.5, font: fontHelvetica, color: darkGray });

    page.drawRectangle({
      x: 305,
      y: currentY - 22,
      width: 255,
      height: 22,
      color: lightGray,
      borderColor: borderGray,
      borderWidth: 0.5,
    });
    page.drawText(`${label2}:`, { x: 310, y: currentY - 15, size: 7.5, font: fontHelveticaBold, color: darkGray });
    page.drawText(String(val2 || '—'), { x: 385, y: currentY - 15, size: 7.5, font: fontHelvetica, color: darkGray });

    currentY -= 25;
  };

  // Section 1: General Info
  drawRow("Date création", bt.date, "Priorité / Type", `${bt.priority} / ${bt.maintenanceType}`);
  drawRow("Équipement", `${bt.machineName} (${bt.machineId})`, "Localisation / Atelier", `${bt.location} • ${bt.atelier || 'Atelier FabLab'}`);
  drawRow("Service Demandeur", bt.serviceDemandeur || bt.service || 'FabLab', "Statut Global", bt.status);

  // Section 2 & 3: Demandeur & Superviseur
  currentY -= 5;
  drawRow("Demandeur (Nom/Tél)", `${bt.demandeurNom || bt.demandeur || '—'} (${bt.demandeurTel || '—'})`, "Email Demandeur", bt.demandeurEmail || '—');
  drawRow("Superviseur", `${bt.superviseurNom || 'Superviseur FabLab'} (${bt.superviseurFonction || 'Responsable'})`, "Avis Superviseur", bt.superviseurAvis ? `${bt.superviseurAvis} - ${bt.superviseurCommentaire || ''}` : 'En attente de validation');

  currentY -= 10;

  const drawSection = (title: string, content: string, heightBox = 40) => {
    if (currentY < 120) {
      page = pdfDoc.addPage([595.28, 841.89]);
      currentY = height - 50;
    }

    page.drawRectangle({
      x: 35,
      y: currentY - 16,
      width: width - 70,
      height: 16,
      color: rgb(0.2, 0.25, 0.35),
    });
    page.drawText(title.toUpperCase(), {
      x: 42,
      y: currentY - 12,
      size: 8,
      font: fontHelveticaBold,
      color: rgb(1, 1, 1),
    });

    page.drawRectangle({
      x: 35,
      y: currentY - 16 - heightBox,
      width: width - 70,
      height: heightBox,
      borderColor: borderGray,
      borderWidth: 0.5,
      color: rgb(0.99, 0.99, 1),
    });

    const textLines = content ? content.match(/.{1,95}(\s+|$)/g) || [content] : ['Aucune observation enregistrée.'];
    let textY = currentY - 28;
    textLines.slice(0, Math.floor(heightBox / 13)).forEach(line => {
      page.drawText(line.trim(), {
        x: 42,
        y: textY,
        size: 7.5,
        font: fontHelvetica,
        color: darkGray,
      });
      textY -= 11;
    });

    currentY -= (18 + heightBox + 10);
  };

  // Section 4 & 5 & 6 & 7
  drawSection("Description de la Panne & Symptômes", `Panne: ${bt.descriptionPanne}\nSymptômes: ${bt.symptomes || 'N/A'}\nCause probable: ${bt.causeProbable || 'N/A'}`, 45);
  drawSection("Diagnostic & Tests Effectués", `Diagnostic: ${bt.diagnosticRealise || 'Diagnostic visuel et fonctionnel'}\nTests: ${bt.testsEffectues || 'Test de tension et réétalonnage'}\nRésultat: ${bt.resultatDiagnostic || 'Conforme'}`, 45);
  drawSection("Travaux Réalisés & Procédure", `Actions: ${bt.actionsEffectuees || bt.interventionRealisee}\nProcédure: ${bt.procedureSuivie || 'Procédure standard maintenance'}\nÉtapes: ${bt.etapesReparation || 'Démontage, remplacement, nettoyage, essai sur banc'}`, 50);

  // Section 8: Spare Parts Table Summary
  if (bt.piecesRechange && bt.piecesRechange.length > 0) {
    const partsStr = bt.piecesRechange.map(p => `- ${p.reference} : ${p.designation} (Qté: ${p.quantite}, PU: ${p.prixUnitaire} MAD, Total: ${p.total} MAD)`).join('\n');
    drawSection("Pièces de Rechange Utilisées", partsStr, 40);
  } else if (bt.piecesUtilisees) {
    drawSection("Pièces de Rechange Utilisées", bt.piecesUtilisees, 35);
  }

  // Section 9 & 10: Tools & Intervention Times
  const toolsStr = bt.outilsUtilises && bt.outilsUtilises.length > 0
    ? bt.outilsUtilises.map(o => `- ${o.outil} (Qté: ${o.quantite}) ${o.observations ? '[' + o.observations + ']' : ''}`).join(', ')
    : 'Outillage standard d\'atelier';

  drawSection("Outils & Temps d'Intervention", `Outils: ${toolsStr}\nHoraires: ${bt.heureDebutIntervention || '08:00'} - ${bt.heureFinIntervention || '10:30'} | Durée intervention: ${bt.tempsIntervention} h | Temps arrêt machine: ${bt.tempsArretMachine || 0} h`, 40);

  // Section 11 & 12: Checkbox & Observations
  const checkStr = [
    bt.verificationTerminee ? "[X] Intervention terminée" : "[ ] Intervention terminée",
    bt.verificationTestee ? "[X] Machine testée" : "[ ] Machine testée",
    bt.verificationConforme ? "[X] Conforme" : "[ ] Conforme",
    bt.verificationNettoyage ? "[X] Nettoyage effectué" : "[ ] Nettoyage effectué",
    bt.verificationValidationTechnique ? "[X] Validation technique" : "[ ] Validation technique"
  ].join("  |  ");

  drawSection("Vérifications Finales & Observations", `${checkStr}\nObservations: ${bt.observations || 'Aucune remarque.'}`, 40);

  // Attachments List Summary
  if (bt.documentsJoints && bt.documentsJoints.length > 0) {
    const docStr = bt.documentsJoints.map(d => `- ${d.name} (${(d.size/1024).toFixed(0)} KB)`).join('  ;  ');
    drawSection("Documents & Pièces Jointes", docStr, 25);
  }

  // Ensure bottom space for Signatures
  if (currentY < 140) {
    page = pdfDoc.addPage([595.28, 841.89]);
    currentY = height - 50;
  }

  // Signatures Box
  page.drawRectangle({
    x: 35,
    y: 60,
    width: 255,
    height: 75,
    borderColor: borderGray,
    borderWidth: 0.5,
  });
  page.drawText("SIGNATURE TECHNICIEN :", { x: 42, y: 120, size: 8, font: fontHelveticaBold, color: darkGray });
  page.drawText(bt.techniciens && bt.techniciens[0] ? `${bt.techniciens[0].nom} (${bt.techniciens[0].fonction})` : (bt.technicienResponsable || 'Technicien'), { x: 42, y: 70, size: 7.5, font: fontHelvetica, color: darkGray });

  if (bt.signatureDataUrl && bt.signatureDataUrl.startsWith('data:image/png;base64,')) {
    try {
      const base64Data = bt.signatureDataUrl.replace(/^data:image\/png;base64,/, '');
      const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const pngImage = await pdfDoc.embedPng(imageBytes);
      page.drawImage(pngImage, {
        x: 135,
        y: 65,
        width: 140,
        height: 45,
      });
    } catch (e) {
      console.warn('Could not embed PNG signature:', e);
    }
  }

  page.drawRectangle({
    x: 305,
    y: 60,
    width: 255,
    height: 75,
    borderColor: borderGray,
    borderWidth: 0.5,
  });
  page.drawText("VALIDATION SUPERVISEUR / RESPONSABLE :", { x: 312, y: 120, size: 8, font: fontHelveticaBold, color: darkGray });
  page.drawText(`${bt.superviseurNom || 'Superviseur'} — ${bt.superviseurFonction || 'Responsable'}`, { x: 312, y: 70, size: 7.5, font: fontHelvetica, color: darkGray });

  if (bt.superviseurSignatureDataUrl && bt.superviseurSignatureDataUrl.startsWith('data:image/png;base64,')) {
    try {
      const base64Data = bt.superviseurSignatureDataUrl.replace(/^data:image\/png;base64,/, '');
      const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const pngImage = await pdfDoc.embedPng(imageBytes);
      page.drawImage(pngImage, {
        x: 405,
        y: 65,
        width: 140,
        height: 45,
      });
    } catch (e) {
      console.warn('Could not embed supervisor PNG signature:', e);
    }
  }

  // Footer Note
  page.drawText("GMA LAB — Work Order System.", {
    x: 150,
    y: 35,
    size: 7,
    font: fontHelvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  let binary = '';
  const bytes = new Uint8Array(pdfBytes);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = window.btoa(binary);
  return `data:application/pdf;base64,${base64}`;
};
