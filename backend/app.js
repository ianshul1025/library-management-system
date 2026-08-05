import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import indexRoutes from "./routes/index.js";

const app = express();

// Middlewares
app.use(cors());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true}));
app.use(cookieParser());

// Routes
app.use("/", indexRoutes);

export default app;