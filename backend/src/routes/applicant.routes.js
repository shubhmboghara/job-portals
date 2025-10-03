import { Router } from 'express';
import {
  registerCompany,
  loginCompany,
  logoutCompany,
  refreshAccessToken,
  getCompanyProfile,
  updateCompanyProfile,
  changePassword,
  updateCompanyLogo,
  deleteCompanyAccount,
} from '../controllers/company.controller.js';
import { protect, authorizeRoles } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

// Public routes
router.route('/register').post(upload.single('logo'), registerCompany);
router.route('/login').post(loginCompany);
router.route('/refresh-token').post(refreshAccessToken);

// Protected Company routes
router.use(protect, authorizeRoles('company'));

router.route('/logout').post(logoutCompany);
router.route('/profile').get(getCompanyProfile).put(updateCompanyProfile);
router.route('/change-password').patch(changePassword);
router.route('/delete-account').delete(deleteCompanyAccount);

router.route('/profile/logo').patch(upload.single('logo'), updateCompanyLogo);

export default router;

