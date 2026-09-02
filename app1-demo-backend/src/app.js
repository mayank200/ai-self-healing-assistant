import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users.js';
import ordersRouter from './routes/orders.js';
import productsRouter from './routes/products.js';
import { logger } from './logger.js';

const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'app1-demo-backend', timestamp: new Date().toISOString() });
});

// Domain Routes
app.use('/api/users', usersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/products', productsRouter);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint Not Found' });
});

// Global Error Handling Middleware - Captures all exceptions and writes to error.log
app.use((err, req, res, next) => {
  logger.error(err);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

export default app;
