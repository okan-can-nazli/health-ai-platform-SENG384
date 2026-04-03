import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";

dotenv.config();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true
  })
);
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    ok: false,
    message: "Too many requests. Please try again later."
  }
});

app.use("/api/auth", authLimiter);
app.use("/api", routes);

export default app;
