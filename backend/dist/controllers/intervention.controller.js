"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateIntervention = exports.createIntervention = exports.getInterventionById = exports.getAllInterventions = void 0;
const json_store_1 = require("../services/json-store");
const getAllInterventions = async (req, res) => {
    try {
        const interventions = (0, json_store_1.readEntity)('interventions');
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
        const interventions = (0, json_store_1.readEntity)('interventions');
        const intervention = interventions.find((i) => String(i.id) === String(id));
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
        const interventions = (0, json_store_1.readEntity)('interventions');
        const newIntervention = { id: req.body.id || `INT-${Date.now()}`, ...req.body };
        interventions.push(newIntervention);
        (0, json_store_1.writeEntity)('interventions', interventions);
        res.status(201).json(newIntervention);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la création' });
    }
};
exports.createIntervention = createIntervention;
const updateIntervention = async (req, res) => {
    try {
        const { id } = req.params;
        const interventions = (0, json_store_1.readEntity)('interventions');
        const index = interventions.findIndex((i) => String(i.id) === String(id));
        if (index === -1)
            return res.status(404).json({ error: 'Intervention introuvable' });
        interventions[index] = { ...interventions[index], ...req.body };
        (0, json_store_1.writeEntity)('interventions', interventions);
        res.json(interventions[index]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
};
exports.updateIntervention = updateIntervention;
