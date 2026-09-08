import { Request, Response } from 'express';
import { readEntity, writeEntity } from '../services/json-store';

export const getAllMachines = async (req: Request, res: Response) => {
  try {
    const machines = readEntity('machines');
    res.json(machines);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des machines' });
  }
};

export const getMachineById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const machines = readEntity<any[]>('machines');
    const machine = machines.find((m: any) => String(m.id) === String(id));
    if (!machine) return res.status(404).json({ error: 'Machine introuvable' });
    res.json(machine);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createMachine = async (req: Request, res: Response) => {
  try {
    const machines = readEntity<any[]>('machines');
    const newMachine = { id: req.body.id || `M-${Date.now()}`, ...req.body };
    machines.push(newMachine);
    writeEntity('machines', machines);
    res.status(201).json(newMachine);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
};

export const updateMachine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const machines = readEntity<any[]>('machines');
    const index = machines.findIndex((m: any) => String(m.id) === String(id));
    if (index === -1) return res.status(404).json({ error: 'Machine introuvable' });
    machines[index] = { ...machines[index], ...req.body };
    writeEntity('machines', machines);
    res.json(machines[index]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
};

export const deleteMachine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let machines = readEntity<any[]>('machines');
    machines = machines.filter((m: any) => String(m.id) !== String(id));
    writeEntity('machines', machines);
    res.json({ message: 'Machine supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
};
