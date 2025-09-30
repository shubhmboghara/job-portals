import { Router } from 'express';
import {
  applyForJob,
  getApplicationsForJob,
  getApplicationById,
  updateApplicationStatus,
  getApplicationsByUser,
} from '../controllers/application.controller.js';
import { protect, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/job/:jobId')
  .post(protect, authorizeRoles('applicant'), applyForJob)
  .get(protect, authorizeRoles('admin', 'company'), getApplicationsForJob);

router.route('/:id')
  .get(protect, getApplicationById)
  .put(protect, authorizeRoles('admin', 'company'), updateApplicationStatus);

router.route('/user/:userId')
  .get(protect, authorizeRoles('applicant', 'admin'), getApplicationsByUser);

export default router;