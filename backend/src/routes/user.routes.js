import { Router } from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfile, uploadResume } from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);

// Upload resume (multipart/form-data) - field name: resume
router.post('/profile/resume', upload.single('resume'), uploadResume);

export default router;import { Router } from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfile, uploadResume } from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);

// Upload resume (multipart/form-data) - field name: resume
router.post('/profile/resume', upload.single('resume'), uploadResume);

export default router;