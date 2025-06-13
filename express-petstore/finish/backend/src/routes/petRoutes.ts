import express from 'express';
import {
  getAllPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
} from '../controllers/petController';

const router = express.Router();

router.get('/', getAllPets);
router.get('/:id', getPet);
router.post('/', createPet);
router.put('/:id', updatePet);
router.delete('/:id', deletePet);

export default router;