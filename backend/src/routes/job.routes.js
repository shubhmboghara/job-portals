import { Router } from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
} from '../controllers/job.controller.js';
import { protect, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/')
  .post(protect, authorizeRoles('admin', 'company'), createJob)
  .get(getJobs);

router.route('/:id')
  .get(getJobById)
  .put(protect, authorizeRoles('admin', 'company'), updateJob)
  .delete(protect, authorizeRoles('admin', 'company'), deleteJob);

export default router;