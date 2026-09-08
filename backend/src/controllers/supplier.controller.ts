import { Request, Response } from 'express';
import { readEntity, writeEntity } from '../services/json-store';

export const getAllSuppliers = async (req: Request, res: Response) => {
  try {
    const suppliers = readEntity('suppliers');
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des fournisseurs' });
  }
};

export const getSupplierById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const suppliers = readEntity<any[]>('suppliers');
    const supplier = suppliers.find((s: any) => String(s.id) === String(id));
    if (!supplier) return res.status(404).json({ error: 'Fournisseur introuvable' });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const suppliers = readEntity<any[]>('suppliers');
    const newSupplier = { id: req.body.id || `SUP-${Date.now()}`, ...req.body };
    suppliers.push(newSupplier);
    writeEntity('suppliers', suppliers);
    res.status(201).json(newSupplier);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création du fournisseur' });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const suppliers = readEntity<any[]>('suppliers');
    const index = suppliers.findIndex((s: any) => String(s.id) === String(id));
    if (index === -1) return res.status(404).json({ error: 'Fournisseur introuvable' });
    suppliers[index] = { ...suppliers[index], ...req.body };
    writeEntity('suppliers', suppliers);
    res.json(suppliers[index]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let suppliers = readEntity<any[]>('suppliers');
    suppliers = suppliers.filter((s: any) => String(s.id) !== String(id));
    writeEntity('suppliers', suppliers);
    res.json({ message: 'Fournisseur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
};
