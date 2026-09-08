"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMachine = exports.updateMachine = exports.createMachine = exports.getMachineById = exports.getAllMachines = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({});
const getAllMachines = async (req, res) => {
    try {
        const machines = await prisma.machine.findMany({
            include: { category: true }
        });
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
        const machine = await prisma.machine.findUnique({
            where: { id: Number(id) },
            include: { category: true, interventions: true, documents: true }
        });
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
        const machine = await prisma.machine.create({
            data: req.body
        });
        res.status(201).json(machine);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la création' });
    }
};
exports.createMachine = createMachine;
const updateMachine = async (req, res) => {
    try {
        const { id } = req.params;
        const machine = await prisma.machine.update({
            where: { id: Number(id) },
            data: req.body
        });
        res.json(machine);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
};
exports.updateMachine = updateMachine;
const deleteMachine = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.machine.delete({
            where: { id: Number(id) }
        });
        res.json({ message: 'Machine supprimée avec succès' });
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
};
exports.deleteMachine = deleteMachine;
