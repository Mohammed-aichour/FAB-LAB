import { Router } from 'express';
import * as supplierController from '../controllers/supplier.controller';
import { requireRoles } from '../middleware/auth';

const router = Router();

router.get('/', supplierController.getAllSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.post('/', requireRoles('Superviseur','Ingénieur'), supplierController.createSupplier);
router.put('/:id', requireRoles('Superviseur','Ingénieur'), supplierController.updateSupplier);
router.delete('/:id', requireRoles('Superviseur'), supplierController.deleteSupplier);

export default router;
