"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupplier = exports.updateSupplier = exports.createSupplier = exports.getSupplierById = exports.getAllSuppliers = void 0;
const json_store_1 = require("../services/json-store");
const getAllSuppliers = async (req, res) => {
    try {
        const suppliers = (0, json_store_1.readEntity)('suppliers');
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
        const suppliers = (0, json_store_1.readEntity)('suppliers');
        const supplier = suppliers.find((s) => String(s.id) === String(id));
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
        const suppliers = (0, json_store_1.readEntity)('suppliers');
        const newSupplier = { id: req.body.id || `SUP-${Date.now()}`, ...req.body };
        suppliers.push(newSupplier);
        (0, json_store_1.writeEntity)('suppliers', suppliers);
        res.status(201).json(newSupplier);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la création du fournisseur' });
    }
};
exports.createSupplier = createSupplier;
const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const suppliers = (0, json_store_1.readEntity)('suppliers');
        const index = suppliers.findIndex((s) => String(s.id) === String(id));
        if (index === -1)
            return res.status(404).json({ error: 'Fournisseur introuvable' });
        suppliers[index] = { ...suppliers[index], ...req.body };
        (0, json_store_1.writeEntity)('suppliers', suppliers);
        res.json(suppliers[index]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
};
exports.updateSupplier = updateSupplier;
const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        let suppliers = (0, json_store_1.readEntity)('suppliers');
        suppliers = suppliers.filter((s) => String(s.id) !== String(id));
        (0, json_store_1.writeEntity)('suppliers', suppliers);
        res.json({ message: 'Fournisseur supprimé avec succès' });
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
};
exports.deleteSupplier = deleteSupplier;
