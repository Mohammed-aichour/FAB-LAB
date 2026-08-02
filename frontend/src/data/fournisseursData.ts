export interface Supplier {
  id: number;
  code: string;
  name: string;
  domain: string;
  contact: string;
  email: string;
  phone: string;
  delaiJours: number;
  paymentTerms: string;
  francoMAD: string;
  evaluation: 'Très bon' | 'Bon' | 'Moyen' | 'Moyen (délai)';
  status: 'Actif' | 'Inactif';
}

export const initialFournisseurs: Supplier[] = [
  {
    "id": 1,
    "code": "Code",
    "name": "Fournisseur",
    "domain": "Domaine",
    "contact": "Contact",
    "email": "contact@fournisseur.ma",
    "phone": "+212 5 22 01 01 01",
    "delaiJours": 5,
    "paymentTerms": "Conditions de paiement",
    "francoMAD": "Franco de port",
    "evaluation": "Bon",
    "status": "Actif"
  },
  {
    "id": 1,
    "code": "F01",
    "name": "3D Distrib. Maroc",
    "domain": "Consommables et pièces impression 3D",
    "contact": "Service commercial",
    "email": "commande@3ddistrib.ma",
    "phone": "+212 5 22 02 02 02",
    "delaiJours": 5,
    "paymentTerms": "30 jours fin de mois",
    "francoMAD": "1 500 MAD",
    "evaluation": "Bon",
    "status": "Actif"
  },
  {
    "id": 2,
    "code": "F02",
    "name": "Formlabs EU",
    "domain": "Résines et consommables SLA",
    "contact": "Distributeur agréé",
    "email": "eu-orders@formlabs.com",
    "phone": "+212 5 22 03 03 03",
    "delaiJours": 21,
    "paymentTerms": "Paiement à la commande",
    "francoMAD": "Non",
    "evaluation": "Moyen (délai)",
    "status": "Actif"
  },
  {
    "id": 3,
    "code": "F03",
    "name": "Trotec Maroc",
    "domain": "Optiques, tube laser, SAV",
    "contact": "Technico-commercial",
    "email": "support@troteclaser.ma",
    "phone": "+212 5 22 04 04 04",
    "delaiJours": 30,
    "paymentTerms": "45 jours",
    "francoMAD": "Non",
    "evaluation": "Bon",
    "status": "Actif"
  },
  {
    "id": 4,
    "code": "F04",
    "name": "Roland Maroc",
    "domain": "Découpe vinyle et CNC de précision",
    "contact": "Service technique",
    "email": "sav@rolanddg.ma",
    "phone": "+212 5 22 05 05 05",
    "delaiJours": 15,
    "paymentTerms": "30 jours",
    "francoMAD": "2 000 MAD",
    "evaluation": "Bon",
    "status": "Actif"
  },
  {
    "id": 5,
    "code": "F05",
    "name": "Outillage Agadir",
    "domain": "Outils coupants, roulements, quincaillerie",
    "contact": "Comptoir",
    "email": "contact@outillage-agadir.ma",
    "phone": "+212 5 22 06 06 06",
    "delaiJours": 10,
    "paymentTerms": "Comptant",
    "francoMAD": "1 000 MAD",
    "evaluation": "Très bon",
    "status": "Actif"
  },
  {
    "id": 6,
    "code": "F06",
    "name": "Elektro Souss",
    "domain": "Composants et matériel électronique",
    "contact": "Comptoir",
    "email": "contact@elektrosouss.ma",
    "phone": "+212 5 22 07 07 07",
    "delaiJours": 5,
    "paymentTerms": "Comptant",
    "francoMAD": "800 MAD",
    "evaluation": "Très bon",
    "status": "Actif"
  },
  {
    "id": 7,
    "code": "F07",
    "name": "AirClean",
    "domain": "Filtration et extraction",
    "contact": "Service commercial",
    "email": "devis@airclean.ma",
    "phone": "+212 5 22 08 08 08",
    "delaiJours": 20,
    "paymentTerms": "30 jours",
    "francoMAD": "Non",
    "evaluation": "Moyen",
    "status": "Actif"
  },
  {
    "id": 8,
    "code": "F08",
    "name": "Air Pro MA",
    "domain": "Compresseurs et air comprimé",
    "contact": "Technicien référent",
    "email": "sav@airpro.ma",
    "phone": "+212 5 22 09 09 09",
    "delaiJours": 12,
    "paymentTerms": "30 jours",
    "francoMAD": "Non",
    "evaluation": "Bon",
    "status": "Actif"
  },
  {
    "id": 9,
    "code": "F09",
    "name": "Textil Pro",
    "domain": "Consommables broderie et textile",
    "contact": "Service commercial",
    "email": "vente@textilpro.ma",
    "phone": "+212 5 22 10 10 10",
    "delaiJours": 10,
    "paymentTerms": "30 jours",
    "francoMAD": "1 200 MAD",
    "evaluation": "Bon",
    "status": "Actif"
  },
  {
    "id": 10,
    "code": "F10",
    "name": "SafeWork MA",
    "domain": "EPI et sécurité",
    "contact": "Service commercial",
    "email": "contact@safework.ma",
    "phone": "+212 5 22 11 11 11",
    "delaiJours": 5,
    "paymentTerms": "30 jours",
    "francoMAD": "500 MAD",
    "evaluation": "Très bon",
    "status": "Actif"
  },
  {
    "id": 11,
    "code": "F11",
    "name": "Chimie Sud",
    "domain": "Produits chimiques et solvants",
    "contact": "Service commercial",
    "email": "contact@chimiesud.ma",
    "phone": "+212 5 22 12 12 12",
    "delaiJours": 4,
    "paymentTerms": "Comptant",
    "francoMAD": "Non",
    "evaluation": "Bon",
    "status": "Actif"
  }
];
