import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import cluster from 'cluster';
import os from 'os';
import app from './app';
import { config } from './config';
import logger from './utils/logger';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.development') });

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

// Log configuration for debugging
logger.info(`🚀 Starting ${config.server.nodeEnv} server`);
logger.info(
  `🔧 Clustering: ${config.server.enableClustering ? 'enabled' : 'disabled'}`
);
logger.debug(`AWS Region: ${config.aws.region}`);

// Get port from config
const port = config.server.port || 3000;

// Function to start the server
const startServer = () => {
  const server = http.createServer(app);

  server.listen(port);

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

    // Handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        logger.error(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        logger.error(`${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  });

  server.on('listening', () => {
    const addr = server.address();
    const bind =
      typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port}`;
    logger.info(`🌐 Server listening on ${bind}`);
    logger.info(`🔍 Health check: http://localhost:${port}/health`);
  });

  // Handle unhandled rejections
  process.on('unhandledRejection', (err: Error) => {
    logger.error('UNHANDLED REJECTION! Shutting down...');
    logger.error(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Starting graceful shutdown...');
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received. Starting graceful shutdown...');
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });

  return server;
};

// Handle clustering for production
if (config.server.enableClustering && cluster.isPrimary) {
  logger.info(`Primary ${process.pid} is running`);

  // Fork workers based on CPU cores
  const numCPUs = os.cpus().length;
  logger.info(`Forking ${numCPUs} workers`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(
      `Worker ${worker.process.pid} died with code: ${code} and signal: ${signal}`
    );
    logger.info('Starting a new worker');
    cluster.fork();
  });

  cluster.on('online', (worker) => {
    logger.info(`Worker ${worker.process.pid} is online`);
  });
} else {
  // Start the server (either no clustering or we are a worker)
  startServer();

  if (cluster.isWorker) {
    logger.info(`Worker ${process.pid} started`);
  }
}

export default app;
