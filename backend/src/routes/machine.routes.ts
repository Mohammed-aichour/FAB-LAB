import { Router } from 'express';
import * as machineController from '../controllers/machine.controller';
import { requireRoles } from '../middleware/auth';

const router = Router();

router.get('/', machineController.getAllMachines);
router.get('/:id', machineController.getMachineById);
router.post('/', requireRoles('Superviseur','Ingénieur'), machineController.createMachine);
router.put('/:id', requireRoles('Superviseur','Ingénieur'), machineController.updateMachine);
router.delete('/:id', requireRoles('Superviseur'), machineController.deleteMachine);

export default router;
