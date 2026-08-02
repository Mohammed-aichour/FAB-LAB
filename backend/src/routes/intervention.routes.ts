import { Router } from 'express';
import * as interventionController from '../controllers/intervention.controller';

const router = Router();

router.get('/', interventionController.getAllInterventions);
router.get('/:id', interventionController.getInterventionById);
router.post('/', interventionController.createIntervention);
router.put('/:id', interventionController.updateIntervention);

export default router;
