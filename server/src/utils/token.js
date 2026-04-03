import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const JWT_EXPIRES_IN = "7d";

export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
