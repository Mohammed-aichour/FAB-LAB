"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupplier = exports.updateSupplier = exports.createSupplier = exports.getSupplierById = exports.getAllSuppliers = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({});
const getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await prisma.supplier.findMany();
        res.json(suppliers);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des fournisseurs' });
    }
};
exports.getAllSuppliers = getAllSuppliers;
const getSupplierById = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = await prisma.supplier.findUnique({
            where: { id: Number(id) },
            include: { parts: { include: { part: true } } }
        });
        if (!supplier)
            return res.status(404).json({ error: 'Fournisseur introuvable' });
        res.json(supplier);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
};
exports.getSupplierById = getSupplierById;
const createSupplier = async (req, res) => {
    try {
        const supplier = await prisma.supplier.create({
            data: req.body
        });
        res.status(201).json(supplier);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la création du fournisseur' });
    }
};
exports.createSupplier = createSupplier;
const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = await prisma.supplier.update({
            where: { id: Number(id) },
            data: req.body
        });
        res.json(supplier);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
};
exports.updateSupplier = updateSupplier;
const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.supplier.delete({
            where: { id: Number(id) }
        });
        res.json({ message: 'Fournisseur supprimé avec succès' });
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
};
exports.deleteSupplier = deleteSupplier;
