// backend/src/app.js
import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoute from "./routes/user.route.js";
import postRoute from "./routes/post.route.js";
import messageRoute from "./routes/message.route.js";
import reelRoute from "./routes/reel.route.js";
import storyRoute from "./routes/story.route.js";
import commentRoute from "./routes/comment.route.js";
import notificationRoute from "./routes/notification.route.js";
import { app, server } from "./socket/socket.js";
import path from "path";

dotenv.config();

const PORT = process.env.PORT || 8000;
const __dirname = path.resolve();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));

// CORS Configuration
const corsOptions = {
    origin: process.env.URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// API Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/post", postRoute);
app.use("/api/v1/message", messageRoute);
app.use("/api/v1/reel", reelRoute);
app.use("/api/v1/story", storyRoute);
app.use("/api/v1/comment", commentRoute);
app.use("/api/v1/notification", notificationRoute);

// Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, "/frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    });
}

// Start Server
server.listen(PORT, () => {
    connectDB();
    console.log(` Server is running on port ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` CORS enabled for: ${process.env.URL || 'http://localhost:5173'}`);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error(' Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error(' Unhandled Rejection:', error);
    process.exit(1);
});