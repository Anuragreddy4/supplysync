import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import router from './routes';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for cross-service calls
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'AI Agents' });
});

// Register routes directly at root and under /api for robust routing compatibility
app.use('/', router);
app.use('/api', router);

// Start the server
app.listen(port, () => {
  console.log(`SupplySync AI Agents service running on port ${port}`);
});
