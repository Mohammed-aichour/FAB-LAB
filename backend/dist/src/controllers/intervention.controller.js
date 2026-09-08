"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateIntervention = exports.createIntervention = exports.getInterventionById = exports.getAllInterventions = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({});
const getAllInterventions = async (req, res) => {
    try {
        const interventions = await prisma.intervention.findMany({
            include: { machine: true, technician: true }
        });
        res.json(interventions);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des interventions' });
    }
};
exports.getAllInterventions = getAllInterventions;
const getInterventionById = async (req, res) => {
    try {
        const { id } = req.params;
        const intervention = await prisma.intervention.findUnique({
            where: { id: Number(id) },
            include: { machine: true, technician: true, stockMovements: true }
        });
        if (!intervention)
            return res.status(404).json({ error: 'Intervention introuvable' });
        res.json(intervention);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
};
exports.getInterventionById = getInterventionById;
const createIntervention = async (req, res) => {
    try {
        const intervention = await prisma.intervention.create({
            data: req.body
        });
        res.status(201).json(intervention);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la création' });
    }
};
exports.createIntervention = createIntervention;
const updateIntervention = async (req, res) => {
    try {
        const { id } = req.params;
        const intervention = await prisma.intervention.update({
            where: { id: Number(id) },
            data: req.body
        });
        res.json(intervention);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
};
exports.updateIntervention = updateIntervention;
