const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const Video = require("./modules/shortApplication");
const Auth = require("./AUTH/Auth");

dotenv.config(); // Ensure this is at the top

const app = express();
app.use(cors());
app.use(express.json()); // Add this to parse JSON bodies
const router = express.Router();

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/ShortVideoDB",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

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
    (file.fieldname === "thumbnails" &&
      allowedImageTypes.includes(file.mimetype)) ||
    (file.fieldname === "videos" && allowedVideoTypes.includes(file.mimetype))
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({ storage, fileFilter });

// POST route for uploading multiple files
router.post(
  "/upload",
  upload.fields([{ name: "thumbnails" }, { name: "videos" }]),
  async (req, res) => {
    try {
      if (!req.files["thumbnails"] || !req.files["videos"]) {
        return res
          .status(400)
          .json({ error: "Both thumbnails and videos files are required." });
      }

      const thumbnails = req.files["thumbnails"].map((file) => file.filename);
      const videos = req.files["videos"].map((file) => file.filename);

      const newVideo = new Video({
        title: req.body.title,
        description: req.body.description,
        thumbnails: thumbnails,
        videos: videos,
        userID: req.body.userID, // Include userID here
      });

      await newVideo.save();

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

// PUT route to update a video record
router.put(
  "/videos/:id",
  upload.fields([
    { name: "thumbnails", maxCount: 10 },
    { name: "videos", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const videoId = req.params.id;
      const updateData = {};

      if (req.files["thumbnails"]) {
        const thumbnails = req.files["thumbnails"].map((file) => file.filename);
        updateData.thumbnails = thumbnails;
      }
      if (req.files["videos"]) {
        const videos = req.files["videos"].map((file) => file.filename);
        updateData.videos = videos;
      }

      if (req.body.title) {
        updateData.title = req.body.title;
      }
      if (req.body.description) {
        updateData.description = req.body.description;
      }
      if (req.body.userID) {
        updateData.userID = req.body.userID; // Include userID here
      }

      const updatedVideo = await Video.findByIdAndUpdate(videoId, updateData, {
        new: true,
      });

      if (!updatedVideo) {
        return res.status(404).json({ error: "Video not found." });
      }

      res
        .status(200)
        .json({ message: "Video updated successfully", data: updatedVideo });
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET route to fetch all video records
router.get("/videos", async (req, res) => {
  try {
    const videos = await Video.find(); // Retrieve all video records

    if (videos.length === 0) {
      return res.status(404).json({ message: "No videos found." });
    }

    res.status(200).json(videos);
  } catch (err) {
    console.error("Fetch error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET route to fetch a single video by ID
router.get("/videos/:id", async (req, res) => {
  try {
    const videoId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ error: "Invalid video ID format." });
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.status(200).json(video);
  } catch (err) {
    console.error("Fetch error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET route to search videos by title
router.get("/videos", async (req, res) => {
  try {
    const searchQuery = req.query.title || "";
    const regex = new RegExp(searchQuery, "i"); // Case-insensitive search
    const videos = await Video.find({ title: regex });

    if (videos.length === 0) {
      return res.status(404).json({ message: "No videos found." });
    }

    res.status(200).json(videos);
  } catch (err) {
    console.error("Fetch error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE route to delete a video record
router.delete("/videos/:id", async (req, res) => {
  try {
    const videoId = req.params.id;
    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if (!deletedVideo) {
      return res.status(404).json({ error: "Video not found." });
    }

    res
      .status(200)
      .json({ message: "Video deleted successfully", data: deletedVideo });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use("/api", router);
app.use("/api/Auth", Auth);
app.use("/uploads", express.static(uploadsDir));

app.listen(4563, () => console.log("Server running on port 4563"));
