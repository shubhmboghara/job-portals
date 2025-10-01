import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const applicantSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    resume: {
      type: String,
    },
    skills: {
      type: [String],
    },
    portfolio: {
      type: String,
    },
    location: {
      type: String,
    },
    experience: {
      type: Number,
    },

    education: [
      {
        level: {
          type: String,
          required: true,
          enum: [
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
        specialization: {
          type: String,
          required: function () {
            const levelsRequiringSpecialization = [
              'Vocational or Technical Training',
              'Associate Degree',
              "Bachelor's Degree",
              "Master's Degree",
              'Professional Degree',
              'Doctorate',
            ];
            return levelsRequiringSpecialization.includes(this.level);
          },
        },
        institution: { type: String, required: true },
        year_of_completion: { type: Number, required: true },
      },
    ],

    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

applicantSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

applicantSchema.methods.isPasswordCorrect = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

applicantSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: 'applicant',
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

const Applicant = mongoose.model('Applicant', applicantSchema);

export default Applicant;
