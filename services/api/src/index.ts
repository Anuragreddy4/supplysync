import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});

app.use(limiter);

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import listingsRoutes from './routes/listings.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import groupBuysRoutes from './routes/groupBuys.routes.js';
import trustRoutes from './routes/trust.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';
import forecastsRoutes from './routes/forecasts.routes.js';
import pricingRoutes from './routes/pricing.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/group-buys', groupBuysRoutes);
app.use('/api/trust', trustRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/forecasts', forecastsRoutes);
app.use('/api/pricing', pricingRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
