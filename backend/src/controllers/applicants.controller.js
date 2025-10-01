import Applicant from '../models/applicant.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
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
    if (!applicant) {
      throw new ApiError(404, 'Applicant not found');
    }

    const accessToken = applicant.generateAccessToken();
    const refreshToken = applicant.generateRefreshToken(); // IMPORTANT: You need to create this method

    applicant.refreshToken = refreshToken;
    await applicant.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, 'Something went wrong while generating tokens for applicant');
  }
};

const registerApplicant = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    throw new ApiError(400, 'Full name, email, and password are required');
  }

  const existingApplicant = await Applicant.findOne({ email });
  if (existingApplicant) {
    throw new ApiError(400, 'Applicant with this email already exists');
  }

  const applicant = await Applicant.create({
    fullName,
    email,
    password,
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

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const applicant = await Applicant.findOne({ email });
  if (!applicant) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await applicant.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

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
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(new ApiResponse(200, {}, 'Applicant logged out'));
});

const getcurrentApplicant = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, 'Applicant profile fetched successfully'));
});

const updateApplicantProfile = asyncHandler(async (req, res) => {
  const { fullName, resume, skills, portfolio, location, experience, education } = req.body;

  const applicant = await Applicant.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        resume,
        skills,
        portfolio,
        location,
        experience,
        education,
      },
    },
    { new: true }
  ).select('-password -refreshToken');

  return res.status(200).json(new ApiResponse(200, applicant, 'Profile updated successfully'));
});

export {
  registerApplicant,
  loginApplicant,
  logoutApplicant,
  getcurrentApplicant,
  updateApplicantProfile,
};
