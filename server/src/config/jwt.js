/**
 * JWT Configuration & Secret Validator
 * Strict security: Requires a strong JWT_SECRET from environment variables.
 * Never falls back to hardcoded defaults.
 */

const MIN_SECRET_LENGTH = 32;

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret || typeof secret !== "string" || secret.trim() === "") {
    throw new Error(
      "FATAL: JWT_SECRET environment variable is missing. Define a secure JWT_SECRET in server/.env."
    );
  }

  const trimmed = secret.trim();

  if (trimmed === "fallback_secret" || trimmed === "secret" || trimmed === "your_jwt_secret_here") {
    throw new Error(
      "FATAL: Insecure JWT_SECRET detected. Default/fallback secrets are strictly prohibited."
    );
  }

  if (trimmed.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `FATAL: JWT_SECRET is too short (${trimmed.length} chars). It must be at least ${MIN_SECRET_LENGTH} characters long.`
    );
  }

  return trimmed;
};

module.exports = { getJwtSecret };

