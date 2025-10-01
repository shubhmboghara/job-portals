// we use this thing for   job     const jobs = await Job.find({})
// ...and populate the 'company' field with these specific details.
// .populate({
//   path: 'company',
//   select: 'company_name company_logo'
// });

import mongoose from 'mongoose';

const jobSchema = mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Company',
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
    skills: {
      type: [String],
      required: true,
    },

    education: [
      {
        level: {
          type: String,
          required: true,
          enum: [
            'Not Required',
            'Some High School',
            'High School Diploma or Equivalent',
            'Vocational or Technical Training',
            'Associate Degree',
            "Bachelor's Degree",
            "Master's Degree",
            'Professional Degree',
            'Doctorate',
          ],
        },
        specialization: { type: String },
      },
    ],

    cover_letter_text: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Job = mongoose.model('Job', jobSchema);

export default Job;
