import { Router } from 'express';
import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from '../controllers/company.controller.js';
import { protect, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/')
  .post(protect, authorizeRoles('admin'), createCompany)
  .get(getCompanies);

router.route('/:id')
  .get(getCompanyById)
  .put(protect, authorizeRoles('admin', 'company'), updateCompany)
  .delete(protect, authorizeRoles('admin'), deleteCompany);

export default router;