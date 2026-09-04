import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import indexRoutes from "./routes/index.js";

const app = express();

// Middlewares
app.use(cors());
app.use(cookieParser());

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/", indexRoutes);

export default app;