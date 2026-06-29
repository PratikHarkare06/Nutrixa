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
      .then(async () => {
        // Obsolete index cleanup to prevent duplicate key errors
        try {
          const collections = await mongoose.connection.db.listCollections().toArray();
          
          if (collections.some(c => c.name === "users")) {
            const usersColl = mongoose.connection.db.collection("users");
            const indexes = await usersColl.indexes();
            if (indexes.some(idx => idx.name === "userId_1")) {
              await usersColl.dropIndex("userId_1");
              console.log("🧹 Successfully dropped obsolete index 'userId_1' on users collection.");
            }
          }

          if (collections.some(c => c.name === "user_profiles")) {
            const profilesColl = mongoose.connection.db.collection("user_profiles");
            const indexes = await profilesColl.indexes();
            for (const idx of indexes) {
              if (idx.name !== "_id_" && idx.name !== "userId_1" && idx.unique) {
                await profilesColl.dropIndex(idx.name);
                console.log(`🧹 Successfully dropped obsolete unique index '${idx.name}' on user_profiles collection.`);
              }
            }
          }
        } catch (err) {
          console.warn("⚠️ Index cleanup skipped:", err.message);
        }
        return mongoose.connection;
      })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
};

module.exports = { connectToDatabase };
