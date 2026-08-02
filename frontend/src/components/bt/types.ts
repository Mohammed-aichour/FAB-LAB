export type MaintenanceType = 'Préventive' | 'Corrective' | 'Curative';
export type PriorityLevel = 'Faible' | 'Moyenne' | 'Haute' | 'Critique';
export type BTStatus = 
  | 'Brouillon'
  | 'En attente'
  | 'En attente de validation du superviseur'
  | 'Envoyé'
  | 'Validé'
  | 'Refusé'
  | 'En cours'
  | 'Terminé';

export interface TechnicienAssignation {
  id: string;
  nom: string;
  fonction: string;
  heureDebut: string;
  heureFin: string;
  tempsPasse: number; // en heures
}

export interface PieceRechangeLigne {
  id: string;
  reference: string;
  designation: string;
  quantite: number;
  stockDisponible: number;
  prixUnitaire: number;
  total: number;
}

export interface OutilLigne {
  id: string;
  outil: string;
  quantite: number;
  observations: string;
}

export interface DocumentJoint {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
}

export interface HistoriqueEnvoi {
  id: string;
  dateEnvoi: string;
  utilisateur: string;
  statut: string;
  destinataireEmail?: string;
  commentaire?: string;
}

export interface BTItem {
  id: string;

  // 1. Informations Générales
  btNumber: string;
  otNumber: string;
  date: string;
  priority: PriorityLevel;
  status: BTStatus;
  maintenanceType: MaintenanceType;
  machineId: string;
  machineName: string;
  location: string;
  atelier: string;
  serviceDemandeur: string;

  // 2. Demandeur
  demandeurNom: string;
  demandeurPrenom: string;
  demandeurService: string;
  demandeurFonction: string;
  demandeurTel: string;
  demandeurEmail: string;

  // 3. Responsable / Superviseur
  superviseurNom: string;
  superviseurFonction: string;
  superviseurService: string;
  superviseurSignatureDataUrl?: string;
  superviseurAvis?: 'APPROUVE' | 'REJETE' | null;
  superviseurCommentaire?: string;

  // 4. Techniciens
  techniciens: TechnicienAssignation[];

  // 5. Description de la panne
  descriptionPanne: string;
  symptomes: string;
  causeProbable: string;

  // 6. Diagnostic
  diagnosticRealise: string;
  testsEffectues: string;
  resultatDiagnostic: string;

  // 7. Travaux réalisés
  actionsEffectuees: string;
  procedureSuivie: string;
  etapesReparation: string;

  // 8. Pièces de rechange
  piecesRechange: PieceRechangeLigne[];

  // 9. Outils utilisés
  outilsUtilises: OutilLigne[];

  // 10. Temps d'intervention
  heureDebutIntervention: string;
  heureFinIntervention: string;
  tempsIntervention: number; // Durée calculée automatiquement (heures)
  tempsArretMachine: number; // Temps d'arrêt machine (heures)

  // 11. Vérification finale
  verificationTerminee: boolean;
  verificationTestee: boolean;
  verificationConforme: boolean;
  verificationNettoyage: boolean;
  verificationValidationTechnique: boolean;

  // 12. Observations
  observations: string;

  // 13. Documents joints
  documentsJoints: DocumentJoint[];

  // Audit & Envois
  signatureDataUrl?: string;
  createdAt: number;
  updatedAt: number;
  pdfDataUrl?: string;
  sentToEmail?: string;
  sentAt?: number;
  historiqueEnvois: HistoriqueEnvoi[];

  // Compatibilité champs hérités
  templateId?: string;
  templateName?: string;
  demandeur?: string;
  service?: string;
  interventionRealisee?: string;
  piecesUtilisees?: string;
  technicienResponsable?: string;
}

export interface BTTemplate {
  id: string;
  name: string;
  code: string;
  description: string;
  maintenanceType: MaintenanceType;
  defaultPriority: PriorityLevel;
  iconColor: string;
  badgeBg: string;
}

export interface BTFilterState {
  search: string;
  dateFrom: string;
  dateTo: string;
  machine: string;
  technician: string;
  status: string;
  priority: string;
  maintenanceType: string;
}
