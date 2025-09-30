import mongoose from 'mongoose';

const jobSchema = mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Company',
    },

    company_name: {
      type: String,
    },
    
    company_logo: {
      type: String,
    },

    title: {
      type: String,
      required: [true, 'Please provide a job title.'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a job description.'],
    },
    location: {
      type: String,
      required: [true, 'Please provide a location.'],
    },

    salary_min: {
      type: Number,
    },
    salary_max: {
      type: Number,
    },

    jobType: {
      type: String,
      required: true,
      enum: ['Full-time', 'Part-time', 'Internship', 'Contract'],
    },

    experience_level: {
      type: String,
      required: true,
      enum: ['Entry', 'Mid', 'Senior'],
    },

    experience_years_min: {
      type: Number,
      default: 0,
    },
    experience_years_max: {
      type: Number,
    },

    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    required_skills: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Job = mongoose.model('Job', jobSchema);

export default Job;
