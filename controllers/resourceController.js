import asyncHandler from "express-async-handler";
import Resource from "../models/resourceModel.js";
import fs from "fs";
import path from "path";
import cloudinary from "cloudinary";
import axios from "axios";
// @desc    Create a new resource
// @route   POST /api/resources
// @access  Private
const createResource = asyncHandler(async (req, res) => {
  const { title, subject, topic, description } = req.body;
  const file = req.file;

  if (!file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const resource = new Resource({
    user: req.user._id,
    title,
    subject,
    topic,
    description,
    fileUrl: file.path, // Store the file path
  });

  const createdResource = await resource.save();
  res.status(201).json(createdResource);
});

// @desc    Get all resources
// @route   GET /api/resources
// @access  Public
const getResources = asyncHandler(async (req, res) => {
  const { subject, topic, search } = req.query;

  let query = {};

  if (subject) query.subject = subject;
  if (topic) query.topic = topic;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const resources = await Resource.find(query).populate("user", "name");
  res.json(resources);
});

// @desc    Create new review
// @route   POST /api/resources/:id/reviews
// @access  Private
const createResourceReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const resource = await Resource.findById(req.params.id);

  if (resource) {
    const alreadyReviewed = resource.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error("Resource already reviewed");
    }

    const review = {
      user: req.user._id,
      rating: Number(rating),
      comment,
    };

    resource.reviews.push(review);
    resource.numReviews = resource.reviews.length;
    resource.rating =
      resource.reviews.reduce((acc, item) => item.rating + acc, 0) /
      resource.reviews.length;

    await resource.save();
    res.status(201).json({ message: "Review added" });
  } else {
    res.status(404);
    throw new Error("Resource not found");
  }
});

const getResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id).populate(
    "reviews.user",
    "name"
  );
  if (resource) {
    res.json(resource);
  } else {
    res.status(404);
    throw new Error("Resource not found");
  }
});

// @desc    Download a resource
// @route   GET /api/resources/:id/download
// @access  Private
const downloadResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error("Resource not found");
  }

  const fileUrl = cloudinary.v2.url(resource.fileUrl, { resource_type: "raw" });

  // Stream the file from Cloudinary
  const response = await axios({
    url: fileUrl,
    method: "GET",
    responseType: "stream",
  });

  // Set headers to force download
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${resource.title || "file"}.pdf"`
  );
  res.setHeader("Content-Type", "application/pdf");

  // Pipe the file to the response
  response.data.pipe(res);
});

const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findByIdAndDelete(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error("Resource not found");
  }
  // Ensure only the owner can delete
  if (resource.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this resource");
  }
  // Safely delete the file
  const filePath = resource.fileUrl;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    // Optionally, you might want to log this error or handle it differently
  }

  res.json({ message: "Resource removed" });
});

export {
  createResource,
  getResources,
  getResource,
  createResourceReview,
  downloadResource,
  deleteResource,
};
