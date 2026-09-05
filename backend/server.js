import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import studentRouter from "./routes/studentRoutes.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// DB
connectDB();

// ROUTES
app.use("/api/auth", authRouter);
app.use("/api/students", studentRouter);

app.get("/", (req, res) => {
    res.send("API WORKING");
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});