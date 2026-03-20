
const mongoose = require("mongoose");

const langSchema =new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ["English", "Amharic", "Afan Oromo", "Swahli"],
    index: true,
  },
  code: {
    type: String,
    required: true,
    enum: ["en", "oro", "amh", "swh"],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

 const Language=mongoose.model('Language',langSchema)
module.exports= Language