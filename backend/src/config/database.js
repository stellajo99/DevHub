const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/devhub';
  console.log(`Attempting to connect to MongoDB: ${mongoUri}`);

  // Different timeouts for different environments
  const isCI = process.env.NODE_ENV === 'test' || process.env.CI;
  const connectionTimeout = isCI ? 30000 : 10000; // 30s for CI, 10s for local

  try {
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: connectionTimeout,
      serverSelectionTimeoutMS: connectionTimeout,
      socketTimeoutMS: connectionTimeout,
      maxPoolSize: 10,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}:${conn.connection.port}`);

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    mongoose.connection.on('connecting', () => {
      console.log('MongoDB connecting...');
    });

    return conn;
  } catch (error) {
    console.error('Database connection failed:', error);
    console.error('Error details:', error.message);
    // Don't exit the process in CI environments - let the health check handle it
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

// Start connection attempt but don't wait for it to complete
connectDB();