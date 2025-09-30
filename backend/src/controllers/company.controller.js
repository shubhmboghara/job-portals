import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import Company from '../models/Company.js';

const createCompany = asyncHandler(async (req, res) => {
  
  res.status(200).json(new ApiResponse(200, {}, 'Create company boilerplate'));
});

const getCompanies = asyncHandler(async (req, res) => {

  res.status(200).json(new ApiResponse(200, {}, 'Get companies boilerplate'));
});

const getCompanyById = asyncHandler(async (req, res) => {

  res.status(200).json(new ApiResponse(200, {}, 'Get company by ID boilerplate'));
});

const updateCompany = asyncHandler(async (req, res) => {
  
  res.status(200).json(new ApiResponse(200, {}, 'Update company boilerplate'));
});

const deleteCompany = asyncHandler(async (req, res) => {
  
  res.status(200).json(new ApiResponse(200, {}, 'Delete company boilerplate'));
});

export {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
};