import { Router } from 'express';
import * as machineController from '../controllers/machine.controller';

const router = Router();

router.get('/', machineController.getAllMachines);
router.get('/:id', machineController.getMachineById);
router.post('/', machineController.createMachine);
router.put('/:id', machineController.updateMachine);
router.delete('/:id', machineController.deleteMachine);

export default router;
