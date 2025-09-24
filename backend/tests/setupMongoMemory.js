// setupMongoMemory.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();            
  const uri = mongo.getUri();
  process.env.MONGODB_URI = uri;                       
  await mongoose.connect(uri, { dbName: 'devhub_test' });
});

afterAll(async () => {
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
});
