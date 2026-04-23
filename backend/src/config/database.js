const mongoose = require("mongoose");
const { env } = require("./env");

let connectionPromise = null;

const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.mongoUri)
      .then(() => mongoose.connection)
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
};

module.exports = { connectToDatabase };
