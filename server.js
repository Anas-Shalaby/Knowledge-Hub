import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import { protect } from "./middleware/authMiddleware.js";
import { registerUser, authUser } from "./controllers/userController.js";
import {
  createResource,
  getResources,
  getResource,
  createResourceReview,
  downloadResource,
  deleteResource,
} from "./controllers/resourceController.js";
import { updateContribution } from "./controllers/contributionController.js";
import { getDashboardData } from "./controllers/dashboardController.js";
import multer from "multer";
import path from "path";
import contributionRoutes from "./routes/contributionRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

dotenv.config();
const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Make sure this uploads directory exists
  },
  filename: function (req, file, cb) {
    cb(null, req.body.fileUrl || Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new Error("Only PDF files are allowed!"));
  },
});

// Routes
app.post("/api/users", registerUser);
app.post("/api/users/login", authUser);

// Resource Routes with Contribution Tracking
app.post(
  "/api/resources",
  protect,
  upload.single("fileUrl"),
  async (req, res, next) => {
    try {
      const resource = await createResource(req, res, next);
      // Update contribution for resource upload
      await updateContribution(req.user._id, "resourceUpload");
      return resource;
    } catch (error) {
      next(error);
    }
  }
);

app.get("/api/resources", getResources);
app.get("/api/resources/:id", getResource);

app.get("/api/resources/:id/download", protect, async (req, res, next) => {
  try {
    const download = await downloadResource(req, res, next);
    // Update contribution for resource download
    await updateContribution(req.user._id, "resourceDownload");
    return download;
  } catch (error) {
    next(error);
  }
});

app.post("/api/resources/:id/reviews", protect, async (req, res, next) => {
  try {
    const review = await createResourceReview(req, res, next);
    // Update contribution for writing a review
    await updateContribution(req.user._id, "reviewWritten");
    return review;
  } catch (error) {
    next(error);
  }
});

app.delete("/api/resources/:id", protect, deleteResource);

// Contribution Routes
app.use("/api/contributions", contributionRoutes);

// Profile Routes
app.use("/api/profile", profileRoutes);

// Dashboard Routes
app.use("/api/dashboard", dashboardRoutes);

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
