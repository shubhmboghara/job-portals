import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Applicant from '../models/applicant.model.js';
import Company from '../models/company.model.js';

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      if (decoded.role === 'applicant') {
        req.user = await Applicant.findById(decoded._id).select('-password');
      } else if (decoded.role === 'company') {
        req.user = await Company.findById(decoded._id).select('-password');
      }

      if (!req.user) {
        throw new ApiError(401, 'User not found. Invalid token.');
      }

      next();
    } catch (error) {
      console.error(error);
      throw new ApiError(401, 'Not authorized, token failed');
    }
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token');
  }
});

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Role (${req.user.role}) is not authorized to access this route`
      );
    }
    next();
  };
};

export { protect, authorizeRoles };