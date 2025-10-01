import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    applicant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Applicant',
      required: true,
      index: true,
    },
    application_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
     cover_letter_text: { 
      type: String 
    },
    status: {
      type: String,
      enum: ['Applied', 'Under Review', 'Shortlisted', 'Interviewing', 'Rejected', 'Hired'],
      default: 'Applied',
    },
    
  },
  { timestamps: true }
);

const Application = mongoose.model('Application', applicationSchema);

export default Application;