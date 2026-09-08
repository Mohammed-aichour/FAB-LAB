import { Request, Response } from 'express';
import { readEntity, writeEntity } from '../services/json-store';

export const getAllInterventions = async (req: Request, res: Response) => {
  try {
    const interventions = readEntity('interventions');
    res.json(interventions);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des interventions' });
  }
};

export const getInterventionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const interventions = readEntity<any[]>('interventions');
    const intervention = interventions.find((i: any) => String(i.id) === String(id));
    if (!intervention) return res.status(404).json({ error: 'Intervention introuvable' });
    res.json(intervention);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createIntervention = async (req: Request, res: Response) => {
  try {
    const interventions = readEntity<any[]>('interventions');
    const newIntervention = { id: req.body.id || `INT-${Date.now()}`, ...req.body };
    interventions.push(newIntervention);
    writeEntity('interventions', interventions);
    res.status(201).json(newIntervention);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
};

export const updateIntervention = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const interventions = readEntity<any[]>('interventions');
    const index = interventions.findIndex((i: any) => String(i.id) === String(id));
    if (index === -1) return res.status(404).json({ error: 'Intervention introuvable' });
    interventions[index] = { ...interventions[index], ...req.body };
    writeEntity('interventions', interventions);
    res.json(interventions[index]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
};
