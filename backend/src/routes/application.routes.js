import { Router } from 'express';
import {
  registerApplicant,
  loginApplicant,
  logoutApplicant,
  refreshAccessToken,
  getApplicantProfile,
  updateApplicantProfile,
  changePassword,
  updateApplicantAvatar,
  updateApplicantResume,
  deleteApplicantAccount,
} from '../controllers/applicant.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js';

const router = Router();

router.route('/register').post(
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
  ]),
  registerApplicant
);
router.route('/login').post(loginApplicant);
router.route('/refresh-token').post(refreshAccessToken);

router.use(protect, authorizeRoles('applicant'));

router.route('/logout').post(logoutApplicant);
router.route('/profile').get(getApplicantProfile).put(updateApplicantProfile);
router.route('/change-password').patch(changePassword);
router.route('/delete-account').delete(deleteApplicantAccount);

router.route('/profile/avatar').patch(upload.single('avatar'), updateApplicantAvatar);
router.route('/profile/resume').patch(upload.single('resume'), updateApplicantResume);

export default router;

