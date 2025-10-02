import Company from '../models/company.model.js';
import Job from '../models/job.model.js';
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

const generateTokensForCompany = async (companyId) => {
  try {
    const company = await Company.findById(companyId);
    if (!company) throw new ApiError(404, 'Company not found');

    const accessToken = company.generateAccessToken();
    const refreshToken = company.generateRefreshToken(); // This method must exist on your model

    company.refreshToken = refreshToken;
    await company.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, 'Something went wrong while generating tokens for company');
  }
};

const registerCompany = asyncHandler(async (req, res) => {
  const { company_name, email, password, website, description, industry, headquarters } = req.body;
  if (!company_name || !email || !password) {
    throw new ApiError(400, 'Company name, email, and password are required');
  }

  const existingCompany = await Company.findOne({ $or: [{ email }, { company_name }] });
  if (existingCompany) {
    throw new ApiError(409, 'Company with this email or name already exists');
  }

  const logoLocalPath = req.file?.path;
  if (!logoLocalPath) {
      throw new ApiError(400, "Company logo file is required");
  }

  const logo = await uploadOnCloudinary(logoLocalPath);
  if(!logo) {
      throw new ApiError(500, "Company logo upload failed");
  }

  const company = await Company.create({ 
      company_name, 
      email, 
      password,
      company_logo: logo.url,
      website,
      description,
      industry,
      headquarters
    });

  if (!company) {
    throw new ApiError(500, 'Something went wrong while registering the company');
  }

  const { accessToken, refreshToken } = await generateTokensForCompany(company._id);
  const createdCompany = company.toObject();
  delete createdCompany.password;
  delete createdCompany.refreshToken;

  return res
    .status(201)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(new ApiResponse(201, createdCompany, 'Company registered successfully'));
});

const loginCompany = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const company = await Company.findOne({ email });
  if (!company) throw new ApiError(401, 'Invalid credentials');

  const isPasswordValid = await company.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, 'Invalid credentials');

  const { accessToken, refreshToken } = await generateTokensForCompany(company._id);
  const loggedInCompany = company.toObject();
  delete loggedInCompany.password;
  delete loggedInCompany.refreshToken;

  return res
    .status(200)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(new ApiResponse(200, loggedInCompany, 'Company logged in successfully'));
});

const logoutCompany = asyncHandler(async (req, res) => {
  await Company.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  return res
    .status(200)
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(new ApiResponse(200, {}, 'Company logged out successfully'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) throw new ApiError(401, 'Unauthorized request');
  
    try {
      const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
      const company = await Company.findById(decodedToken?._id);
  
      if (!company || incomingRefreshToken !== company.refreshToken) {
        throw new ApiError(401, 'Refresh token is expired or used');
      }
  
      const { accessToken, refreshToken: newRefreshToken } = await generateTokensForCompany(company._id);
  
      return res
        .status(200)
        .cookie('accessToken', accessToken, cookieOptions)
        .cookie('refreshToken', newRefreshToken, cookieOptions)
        .json(new ApiResponse(200, {}, 'Access token refreshed'));
    } catch (error) {
      throw new ApiError(401, error?.message || 'Invalid refresh token');
    }
});

const getCompanyProfile = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, 'Company profile fetched successfully'));
});

const updateCompanyProfile = asyncHandler(async (req, res) => {
  const { company_name, website, description, industry, headquarters } = req.body;
  const company = await Company.findByIdAndUpdate(
    req.user._id,
    { $set: { company_name, website, description, industry, headquarters } },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');
  return res.status(200).json(new ApiResponse(200, company, 'Profile updated successfully'));
});

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) throw new ApiError(400, 'Old and new passwords are required');

    const company = await Company.findById(req.user._id);
    const isPasswordCorrect = await company.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) throw new ApiError(400, 'Invalid old password');
    
    company.password = newPassword;
    await company.save();

    return res.status(200).json(new ApiResponse(200, {}, 'Password changed successfully'));
});

const updateCompanyLogo = asyncHandler(async (req, res) => {
    const logoLocalPath = req.file?.path;
    if (!logoLocalPath) throw new ApiError(400, "Company logo file is missing");

    const company = await Company.findById(req.user._id);
    const oldLogoUrl = company.company_logo;

    const logo = await uploadOnCloudinary(logoLocalPath);
    if (!logo || !logo.url) throw new ApiError(500, "Error while uploading company logo");

    company.company_logo = logo.url;
    await company.save({ validateBeforeSave: false });

    if (oldLogoUrl) {
        const publicIdValue = publicId(oldLogoUrl);
        if (publicIdValue) await deleteFromCloudinary(publicIdValue);
    }

    return res.status(200).json(new ApiResponse(200, { company_logo: logo.url }, "Company logo updated successfully"));
});

const deleteCompanyAccount = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.user._id);

    if (company.company_logo) {
        const publicIdValue = publicId(company.company_logo);
        if(publicIdValue) await deleteFromCloudinary(publicIdValue);
    }

    await Job.deleteMany({ company: req.user._id });

    await Company.findByIdAndDelete(req.user._id);

    return res
        .status(200)
        .clearCookie('accessToken', cookieOptions)
        .clearCookie('refreshToken', cookieOptions)
        .json(new ApiResponse(200, {}, "Company account and all associated jobs have been deleted."));
});

export {
  registerCompany,
  loginCompany,
  logoutCompany,
  refreshAccessToken,
  getCompanyProfile,
  updateCompanyProfile,
  changePassword,
  updateCompanyLogo,
  deleteCompanyAccount,
};

