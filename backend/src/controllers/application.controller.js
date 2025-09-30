import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import Application from '../models/Application.js';
import Job from '../models/Job.js';



const applyForJob = asyncHandler(async (req, res) => {
 
  res.status(200).json(new ApiResponse(200, {}, 'Apply for job boilerplate'));
});



const getApplicationsForJob = asyncHandler(async (req, res) => {

  res.status(200).json(new ApiResponse(200, {}, 'Get applications for job boilerplate'));
});


const getApplicationById = asyncHandler(async (req, res) => {

  res.status(200).json(new ApiResponse(200, {}, 'Get application by ID boilerplate'));
});


const updateApplicationStatus = asyncHandler(async (req, res) => {

  res.status(200).json(new ApiResponse(200, {}, 'Update application status boilerplate'));
});


const getApplicationsByUser = asyncHandler(async (req, res) => {

  res.status(200).json(new ApiResponse(200, {}, 'Get applications by user boilerplate'));
});

export {
  applyForJob,
  getApplicationsForJob,
  getApplicationById,
  updateApplicationStatus,
  getApplicationsByUser,
};