import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({});

export const getAllMachines = async (req: Request, res: Response) => {
  try {
    const machines = await prisma.machine.findMany({
      include: { category: true }
    });
    res.json(machines);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des machines' });
  }
};

export const getMachineById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const machine = await prisma.machine.findUnique({
      where: { id: Number(id) },
      include: { category: true, interventions: true, documents: true }
    });
    if (!machine) return res.status(404).json({ error: 'Machine introuvable' });
    res.json(machine);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createMachine = async (req: Request, res: Response) => {
  try {
    const machine = await prisma.machine.create({
      data: req.body
    });
    res.status(201).json(machine);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
};

export const updateMachine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const machine = await prisma.machine.update({
      where: { id: Number(id) },
      data: req.body
    });
    res.json(machine);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
};

export const deleteMachine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.machine.delete({
      where: { id: Number(id) }
    });
    res.json({ message: 'Machine supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
};
