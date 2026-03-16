
const mongoose = require("mongoose");

const langSchema = mongoose.Schema({
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

module.exports=mongoose.model('Language',langSchema)