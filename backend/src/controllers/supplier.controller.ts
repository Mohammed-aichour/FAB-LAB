import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({});

export const getAllSuppliers = async (req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des fournisseurs' });
  }
};

export const getSupplierById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id: Number(id) },
      include: { parts: { include: { part: true } } }
    });
    if (!supplier) return res.status(404).json({ error: 'Fournisseur introuvable' });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const supplier = await prisma.supplier.create({
      data: req.body
    });
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création du fournisseur' });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.update({
      where: { id: Number(id) },
      data: req.body
    });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.supplier.delete({
      where: { id: Number(id) }
    });
    res.json({ message: 'Fournisseur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
};
