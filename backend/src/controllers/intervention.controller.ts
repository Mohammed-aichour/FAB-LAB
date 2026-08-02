import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({});

export const getAllInterventions = async (req: Request, res: Response) => {
  try {
    const interventions = await prisma.intervention.findMany({
      include: { machine: true, technician: true }
    });
    res.json(interventions);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des interventions' });
  }
};

export const getInterventionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const intervention = await prisma.intervention.findUnique({
      where: { id: Number(id) },
      include: { machine: true, technician: true, stockMovements: true }
    });
    if (!intervention) return res.status(404).json({ error: 'Intervention introuvable' });
    res.json(intervention);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createIntervention = async (req: Request, res: Response) => {
  try {
    const intervention = await prisma.intervention.create({
      data: req.body
    });
    res.status(201).json(intervention);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
};

export const updateIntervention = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const intervention = await prisma.intervention.update({
      where: { id: Number(id) },
      data: req.body
    });
    res.json(intervention);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
};
