import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const companySchema = new mongoose.Schema(
  {
    company_name: {
      type: String,
      required: true,
      unique: true,
    },

    company_logo: {
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

    website_url: {
      type: String,
    },
    description: {
      type: String,
    },
    industry: {
      type: String,
    },
    headquarters: {
      type: String,
    },

    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

companySchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

companySchema.methods.isPasswordCorrect = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

companySchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: 'company',
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

const Company = mongoose.model('Company', companySchema);

export default Company;
