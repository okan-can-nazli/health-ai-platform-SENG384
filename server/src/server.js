import app from "./app.js";
import { testDatabaseConnection } from "./config/db.js";

const PORT = process.env.PORT || 5000;
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 3000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await testDatabaseConnection();
      console.log("Database is ready.");
      return;
    } catch (error) {
      console.error(
        `Database connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`
      );

      if (attempt === MAX_RETRIES) {
        throw error;
      }

      await wait(RETRY_DELAY_MS);
    }
  }
}

async function startServer() {
  try {
    await connectWithRetry();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
