import app from './src/app.js';
import connectDB from './src/config/db.js';
import { configDotenv } from 'dotenv';

configDotenv();
const port = process.env.PORT || 3000;

connectDB();
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});