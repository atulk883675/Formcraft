
const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const pageSchema = new mongoose.Schema(
  {
    pageId: {
      type: String,
      default: () => randomUUID(),
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Page 1",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    questions: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  { _id: false }
);

const formSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 150,
      default: "Untitled Form",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Education",
        "Business",
        "Events",
        "Employment",
        "Healthcare",
        "General",
      ],
      default: "General",
    },
    status: {
      type: String,
      enum: ["Draft", "Published", "Closed", "Unpublished"],
      default: "Draft",
      required: true,
    },
    pages: {
      type: [pageSchema],
      default: () => [{}],
    },
    publicId: {
     type: String,
     unique: true,
     sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

const Form = mongoose.models.Form || mongoose.model("Form", formSchema);

module.exports = Form;
