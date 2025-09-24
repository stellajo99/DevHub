const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devhub', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000, // 30 seconds for CI environments
      serverSelectionTimeoutMS: 30000, // 30 seconds for CI environments
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

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

    return conn;
  } catch (error) {
    console.error('Database connection failed:', error);
    // Don't exit the process in CI environments - let the health check handle it
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

// Start connection attempt but don't wait for it to complete
connectDB();