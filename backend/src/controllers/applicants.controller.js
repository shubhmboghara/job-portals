import { Applicant } from '../models/user.model.js';
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

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, 'Something went wrong while generating tokens');
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;

  if (!fullname || !email || !username || !password) {
    throw new ApiError(400, 'All fields are required');
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username: username.toLowerCase() }],
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ApiError(400, 'User already exist with this Email id');
    }

    if (existingUser.username === username.toLowerCase()) {
      throw new ApiError(400, 'User already exist with this Username');
    }
  }

  const user = await User.create({
    fullname,
    username: username.toLowerCase(),
    email,
    password,
  });

  if (!user) {
    throw new ApiError(500, 'Something went wrong while registering the user');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const createdUser = user.toObject();
  delete createdUser.password;
  delete createdUser.refreshToken;

  return res
    .status(201)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(new ApiResponse(201, createdUser, 'User registered successfully'));
});

const loggedInUser = asyncHandler(async (req, res) => {
  const { emailorusername, password } = req.body;

  if (!emailorusername || !password) {
    throw new ApiError(400, 'Username/email and password are required ');
  }

  const user = await User.findOne({
    $or: [{ email: emailorusername }, { username: emailorusername.toLowerCase() }],
  });

  if (!user) {
    throw new ApiError(401, 'Invalid Username and Email ');
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid  Password');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = user.toObject();
  delete loggedInUser.password;
  delete loggedInUser.refreshToken;

  return res
    .status(200)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(new ApiResponse(200, loggedInUser, 'User logged in successfully'));
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } }, { new: true });

  return res
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(new ApiResponse(200, {}, 'User logged out'));
});

const refreshAccesToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    if (incomingRefreshToken != user.refreshToken) {
      throw new ApiError(401, 'Refresh token expired or used');
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie('accessToken', accessToken, cookieOptions)
      .cookie('refreshToken', refreshToken, cookieOptions)
      .json(new ApiResponse(200, {}, 'Access token refreshed'));
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid refresh token');
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, 'Current user fetched successfully'));
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, 'Both old and new passwords are required');
  }

  const user = await User.findById(req.user._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, 'Invalid old password');
  }

  user.password = newPassword;

  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, 'Password changed successfully'));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email, username } = req.body;

  if (!fullname && !email && !username) {
    throw new ApiError(400, 'At least one field is required');
  }

  if (email || username) {
    const or = [];
    if (email) or.push({ email });
    if (username) or.push({ username: username.toLowerCase() });

    const existingUser = await User.findOne({
      $or: or,
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      if (email && existingUser.email === email) {
        throw new ApiError(400, 'User already exist with this Email id');
      }

      if (username && existingUser.username === username.toLowerCase()) {
        throw new ApiError(400, 'User already exist with this Username');
      }
    }
  }

  const updateData = {};

  if (fullname) updateData.fullname = fullname;
  if (email) updateData.email = email;
  if (username) updateData.username = username.toLowerCase();

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateData },
    { new: true }
  ).select('-password -refreshToken');

  return res.status(200).json(new ApiResponse(200, user, 'Account details updated'));
});

export {
  registerUser,
  loggedInUser,
  logoutUser,
  refreshAccesToken,
  getCurrentUser,
  changePassword,
  updateAccountDetails,
};
