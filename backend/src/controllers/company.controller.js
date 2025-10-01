// import asyncHandler from '../utils/asyncHandler.js';
// import ApiResponse from '../utils/ApiResponse.js';
// import ApiError from '../utils/ApiError.js';
// import Company from '../models/Company.js';

// const createCompany = asyncHandler(async (req, res) => {
  
//   res.status(200).json(new ApiResponse(200, {}, 'Create company boilerplate'));
// });

// const getCompanies = asyncHandler(async (req, res) => {

//   res.status(200).json(new ApiResponse(200, {}, 'Get companies boilerplate'));
// });

// const getCompanyById = asyncHandler(async (req, res) => {

//   res.status(200).json(new ApiResponse(200, {}, 'Get company by ID boilerplate'));
// });

// const updateCompany = asyncHandler(async (req, res) => {
  
//   res.status(200).json(new ApiResponse(200, {}, 'Update company boilerplate'));
// });

// const deleteCompany = asyncHandler(async (req, res) => {
  
//   res.status(200).json(new ApiResponse(200, {}, 'Delete company boilerplate'));
// });

// export {
//   createCompany,
//   getCompanies,
//   getCompanyById,
//   updateCompany,
//   deleteCompany,
// };



import Company from '../models/Company.model.js';
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

const generateTokensForCompany = async (companyId) => {
  try {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new ApiError(404, 'Company not found');
    }

    const accessToken = company.generateAccessToken();
    const refreshToken = company.generateRefreshToken(); // IMPORTANT: You need to create this method

    company.refreshToken = refreshToken;
    await company.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, 'Something went wrong while generating tokens for company');
  }
};

const registerCompany = asyncHandler(async (req, res) => {
  const { company_name, email, password } = req.body;

  if (!company_name || !email || !password) {
    throw new ApiError(400, 'Company name, email, and password are required');
  }

  const existingCompany = await Company.findOne({ $or: [{ email }, { company_name }] });
  if (existingCompany) {
    throw new ApiError(400, 'Company with this email or name already exists');
  }

  const company = await Company.create({
    company_name,
    email,
    password,
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

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const company = await Company.findOne({ email });
  if (!company) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await company.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

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
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(new ApiResponse(200, {}, 'Company logged out'));
});

const getCompanyProfile = asyncHandler(async (req, res) => {

  return res.status(200).json(new ApiResponse(200, req.user, 'Company profile fetched successfully'));
});
  
const updateCompanyProfile = asyncHandler(async (req, res) => {
    const { company_name, company_logo, website, description, industry, headquarters } = req.body;

    const company = await Company.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                company_name,
                company_logo,
                website,
                description,
                industry,
                headquarters
            }
        },
        { new: true }
    ).select('-password -refreshToken');

    return res.status(200).json(new ApiResponse(200, company, 'Profile updated successfully'));
});

export {
  registerCompany,
  loginCompany,
  logoutCompany,
  getCompanyProfile,
  updateCompanyProfile,
};
