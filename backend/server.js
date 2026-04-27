const app = require("./src/app");
const { connectToDatabase } = require("./src/config/database");
const { env } = require("./src/config/env");

const startServer = async () => {
  try {
    await connectToDatabase();
    app.listen(env.port, () => {
      console.log(`NutriVision backend listening on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start backend", error);
    process.exit(1);
  }
};

startServer();
// Added nodemon.json ignore rule
