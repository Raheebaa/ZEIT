const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  CategoryName: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  CategoryImage: {
    type: String,
    required: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  offerPercentage: {
    type: Number, // Assuming offerPercentage is a number
    default: 0 // Default value or adjust accordingly
  }
});

const Category = mongoose.model("Categories", CategorySchema);

module.exports = Category;
