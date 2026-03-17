const mongoose=require("mongoose")

const resourceSchema = new mongoose.Schema(
  {
    title: String,
    type: { type: String, enum: ["pdf", "link", "audio", "image"] },
    url: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Teacher ID
    tags: [String],
  },
  { timestamps: true },
);
 
 const Resource=mongoose.model('Resource',resourceSchema)
 module.exports = Resource;