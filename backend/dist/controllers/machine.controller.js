"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMachine = exports.updateMachine = exports.createMachine = exports.getMachineById = exports.getAllMachines = void 0;
const json_store_1 = require("../services/json-store");
const getAllMachines = async (req, res) => {
    try {
        const machines = (0, json_store_1.readEntity)('machines');
        res.json(machines);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des machines' });
    }
};
exports.getAllMachines = getAllMachines;
const getMachineById = async (req, res) => {
    try {
        const { id } = req.params;
        const machines = (0, json_store_1.readEntity)('machines');
        const machine = machines.find((m) => String(m.id) === String(id));
        if (!machine)
            return res.status(404).json({ error: 'Machine introuvable' });
        res.json(machine);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
};
exports.getMachineById = getMachineById;
const createMachine = async (req, res) => {
    try {
        const machines = (0, json_store_1.readEntity)('machines');
        const newMachine = { id: req.body.id || `M-${Date.now()}`, ...req.body };
        machines.push(newMachine);
        (0, json_store_1.writeEntity)('machines', machines);
        res.status(201).json(newMachine);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la création' });
    }
};
exports.createMachine = createMachine;
const updateMachine = async (req, res) => {
    try {
        const { id } = req.params;
        const machines = (0, json_store_1.readEntity)('machines');
        const index = machines.findIndex((m) => String(m.id) === String(id));
        if (index === -1)
            return res.status(404).json({ error: 'Machine introuvable' });
        machines[index] = { ...machines[index], ...req.body };
        (0, json_store_1.writeEntity)('machines', machines);
        res.json(machines[index]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
};
exports.updateMachine = updateMachine;
const deleteMachine = async (req, res) => {
    try {
        const { id } = req.params;
        let machines = (0, json_store_1.readEntity)('machines');
        machines = machines.filter((m) => String(m.id) !== String(id));
        (0, json_store_1.writeEntity)('machines', machines);
        res.json({ message: 'Machine supprimée avec succès' });
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
};
exports.deleteMachine = deleteMachine;
