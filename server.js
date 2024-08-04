const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const Video = require("./modules/shortApplication"); // Correct model import

dotenv.config();

const app = express();
const router = express.Router();

app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/ShortVideoDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected to ShortVideoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Debug statements to verify environment variables
console.log("Cloudinary Configuration:");
console.log("CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log(
  "API_KEY:",
  process.env.CLOUDINARY_API_KEY ? "Loaded" : "Not Loaded"
);
console.log(
  "API_SECRET:",
  process.env.CLOUDINARY_API_SECRET ? "Loaded" : "Not Loaded"
);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/png"];
  const allowedVideoTypes = ["video/mp4"];
  if (
    file.fieldname === "thumbnail" &&
    allowedImageTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else if (
    file.fieldname === "video" &&
    allowedVideoTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({ storage, fileFilter });

// POST route for uploading files
router.post(
  "/upload",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // Check if files are uploaded
      if (!req.files["thumbnail"] || !req.files["video"]) {
        return res
          .status(400)
          .json({ error: "Both thumbnail and video files are required." });
      }

      // Extract file details
      const thumbnail = req.files["thumbnail"][0];
      const video = req.files["video"][0];

      // Create a new Video instance with the uploaded file information
      const newVideo = new Video({
        title: req.body.title, // Assuming title is sent in the request body
        description: req.body.description, // Assuming description is sent in the request body
        thumbnail: thumbnail.filename,
        video: video.filename,
      });

      // Save to MongoDB
      await newVideo.save();

      // Send success response
      res.status(201).json({
        message: "Files uploaded and data saved successfully",
        data: newVideo,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET route to fetch all video records
router.get("/videos", async (req, res) => {
  try {
    const videos = await Video.find(); // Fetch all records
    res.status(200).json({ data: videos });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT route to update a video record
router.put(
  "/videos/:id",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const videoId = req.params.id;

      // Check if files are uploaded
      const updateData = {};
      if (req.files["thumbnail"]) {
        const thumbnail = req.files["thumbnail"][0];
        updateData.thumbnail = thumbnail.filename;
      }
      if (req.files["video"]) {
        const video = req.files["video"][0];
        updateData.video = video.filename;
      }

      // Check if title and description are provided in the request body
      if (req.body.title) {
        updateData.title = req.body.title;
      }
      if (req.body.description) {
        updateData.description = req.body.description;
      }

      // Update the video record in MongoDB
      const updatedVideo = await Video.findByIdAndUpdate(videoId, updateData, {
        new: true,
      });

      if (!updatedVideo) {
        return res.status(404).json({ error: "Video not found." });
      }

      // Send success response
      res.status(200).json({
        message: "Video updated successfully",
        data: updatedVideo,
      });
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET route to fetch a video by ID
router.get("/videos/:id", async (req, res) => {
  try {
    const videoId = req.params.id;
    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ error: "Video not found." });
    }

    res.status(200).json({ data: video });
  } catch (error) {
    console.error("Fetch by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT route to update a video record
router.put(
  "/videos/:id",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const videoId = req.params.id;

      // Check if files are uploaded
      const updateData = {};
      if (req.files["thumbnail"]) {
        const thumbnail = req.files["thumbnail"][0];
        updateData.thumbnail = thumbnail.filename;
      }
      if (req.files["video"]) {
        const video = req.files["video"][0];
        updateData.video = video.filename;
      }

      // Check if title and description are provided in the request body
      if (req.body.title) {
        updateData.title = req.body.title;
      }
      if (req.body.description) {
        updateData.description = req.body.description;
      }

      // Update the video record in MongoDB
      const updatedVideo = await Video.findByIdAndUpdate(videoId, updateData, {
        new: true,
      });

      if (!updatedVideo) {
        return res.status(404).json({ error: "Video not found." });
      }

      // Send success response
      res.status(200).json({
        message: "Video updated successfully",
        data: updatedVideo,
      });
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.use("/api", router);

// Serve static files
app.use("/uploads", express.static(uploadsDir));

app.listen(4563, () => console.log("Server running on port 4563"));
