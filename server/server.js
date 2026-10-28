require("dotenv").config();

const { getJwtSecret } = require("./src/config/jwt");

// Validate environment security on startup; fails safely if missing or insecure
try {
  getJwtSecret();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
