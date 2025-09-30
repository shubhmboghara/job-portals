import express from 'express';
import cors from "cors"
import cookieParser from 'cookie-parser';
import userRoutes from './routes/user.routes.js';
import jobRoutes from './routes/job.routes.js';
import companyRoutes from './routes/company.routes.js';
import applicationRoutes from './routes/application.routes.js';
const app = express();


app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
  }))


app.use(express.json({ limit: "50kb" })) // josn data 
app.use(express.urlencoded({ extended: true, limit: "50kb" })) // html from data
app.use(express.static("public"))// Serve static files from the "public" directory.
app.use(cookieParser());




app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);


app.use('/api/companies', companyRoutes);
app.use('/api/applications', applicationRoutes);

export default app;