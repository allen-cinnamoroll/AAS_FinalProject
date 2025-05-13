import express from 'express';
import { getStudentsInSection } from '../controllers/sectionController.js';
import { authenticate, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get students in a section
router.get('/:sectionId/students', 
  authenticate, 
  authorizeRole('admin', 'instructor'),
  getStudentsInSection
);

export default router; 