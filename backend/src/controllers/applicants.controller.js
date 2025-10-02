import Applicant from '../models/applicant.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { uploadOnCloudinary, deleteFromCloudinary, publicId } from '../config/cloudinary.js';
import jwt from 'jsonwebtoken';

const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'None' : 'Lax',
};

const generateTokensForApplicant = async (applicantId) => {
  try {
    const applicant = await Applicant.findById(applicantId);
    if (!applicant) throw new ApiError(404, 'Applicant not found');

    const accessToken = applicant.generateAccessToken();
    const refreshToken = applicant.generateRefreshToken();

    applicant.refreshToken = refreshToken;
    await applicant.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, 'Something went wrong while generating tokens for applicant');
  }
};

const registerApplicant = asyncHandler(async (req, res) => {
  const { fullName, email, password, skills, portfolio, location, experience, education } =
    req.body;
  if (!fullName || !email || !password) {
    throw new ApiError(400, 'Full name, email, and password are required');
  }

  const existingApplicant = await Applicant.findOne({ email });
  if (existingApplicant) {
    throw new ApiError(409, 'Applicant with this email already exists');
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar file is required');
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(500, 'Avatar upload failed');
  }

  let resumeUrl = '';
  const resumeLocalPath = req.files?.resume?.[0]?.path;
  if (resumeLocalPath) {
    const resume = await uploadOnCloudinary(resumeLocalPath);
    if (resume) {
      resumeUrl = resume.url;
    }
  }

  const applicant = await Applicant.create({
    fullName,
    email,
    password,
    avatar: avatar.url,
    resume: resumeUrl,
    skills,
    portfolio,
    location,
    experience,
    education,
  });
  if (!applicant) {
    throw new ApiError(500, 'Something went wrong while registering the applicant');
  }

  const { accessToken, refreshToken } = await generateTokensForApplicant(applicant._id);
  const createdApplicant = applicant.toObject();
  delete createdApplicant.password;
  delete createdApplicant.refreshToken;

  return res
    .status(201)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(new ApiResponse(201, createdApplicant, 'Applicant registered successfully'));
});

const loginApplicant = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const applicant = await Applicant.findOne({ email });
  if (!applicant) throw new ApiError(401, 'Invalid credentials');

  const isPasswordValid = await applicant.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, 'Invalid credentials');

  const { accessToken, refreshToken } = await generateTokensForApplicant(applicant._id);
  const loggedInApplicant = applicant.toObject();
  delete loggedInApplicant.password;
  delete loggedInApplicant.refreshToken;

  return res
    .status(200)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(new ApiResponse(200, loggedInApplicant, 'Applicant logged in successfully'));
});

const logoutApplicant = asyncHandler(async (req, res) => {
  await Applicant.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  return res
    .status(200)
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(new ApiResponse(200, {}, 'Applicant logged out successfully'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, 'Unauthorized request');

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const applicant = await Applicant.findById(decodedToken?._id);

    if (!applicant || incomingRefreshToken !== applicant.refreshToken) {
      throw new ApiError(401, 'Refresh token is expired or used');
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateTokensForApplicant(
      applicant._id
    );

    return res
      .status(200)
      .cookie('accessToken', accessToken, cookieOptions)
      .cookie('refreshToken', newRefreshToken, cookieOptions)
      .json(new ApiResponse(200, {}, 'Access token refreshed'));
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid refresh token');
  }
});

const getApplicantProfile = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, 'Applicant profile fetched successfully'));
});

const updateApplicantProfile = asyncHandler(async (req, res) => {
  const { fullName, skills, portfolio, location, experience, education } = req.body;
  const applicant = await Applicant.findByIdAndUpdate(
    req.user._id,
    { $set: { fullName, skills, portfolio, location, experience, education } },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');
  return res.status(200).json(new ApiResponse(200, applicant, 'Profile updated successfully'));
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) throw new ApiError(400, 'Old and new passwords are required');

  const applicant = await Applicant.findById(req.user._id);
  const isPasswordCorrect = await applicant.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) throw new ApiError(400, 'Invalid old password');

  applicant.password = newPassword;
  await applicant.save();

  return res.status(200).json(new ApiResponse(200, {}, 'Password changed successfully'));
});

const updateApplicantAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) throw new ApiError(400, 'Avatar file is missing');

  const applicant = await Applicant.findById(req.user._id);
  const oldAvatarUrl = applicant.avatar;

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar || !avatar.url) throw new ApiError(500, 'Error while uploading avatar');

  applicant.avatar = avatar.url;
  await applicant.save({ validateBeforeSave: false });

  if (oldAvatarUrl) {
    const publicIdValue = publicId(oldAvatarUrl);
    if (publicIdValue) await deleteFromCloudinary(publicIdValue);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { avatar: avatar.url }, 'Avatar updated successfully'));
});

const updateApplicantResume = asyncHandler(async (req, res) => {
  const resumeLocalPath = req.file?.path;
  if (!resumeLocalPath) throw new ApiError(400, 'Resume file is missing');

  const applicant = await Applicant.findById(req.user._id);
  const oldResumeUrl = applicant.resume;

  const resume = await uploadOnCloudinary(resumeLocalPath);
  if (!resume || !resume.url) throw new ApiError(500, 'Error while uploading resume');

  applicant.resume = resume.url;
  await applicant.save({ validateBeforeSave: false });

  if (oldResumeUrl) {
    const publicIdValue = publicId(oldResumeUrl);
    if (publicIdValue) await deleteFromCloudinary(publicIdValue);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { resume: resume.url }, 'Resume updated successfully'));
});

const deleteApplicantAccount = asyncHandler(async (req, res) => {
  const applicant = await Applicant.findById(req.user._id);

  if (applicant.avatar) {
    const publicIdValue = publicId(applicant.avatar);
    if (publicIdValue) await deleteFromCloudinary(publicIdValue);
  }
  if (applicant.resume) {
    const publicIdValue = publicId(applicant.resume);
    if (publicIdValue) await deleteFromCloudinary(publicIdValue);
  }

  await Applicant.findByIdAndDelete(req.user._id);

  return res
    .status(200)
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(new ApiResponse(200, {}, 'Applicant account deleted successfully'));
});

export {
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
};
