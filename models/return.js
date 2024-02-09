const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId },
  orderId: { type: mongoose.Schema.Types.ObjectId },
  status: { type: String, default: "NotVerified" }, // Change "Status" to "status"
  product: { type: mongoose.Schema.Types.ObjectId },
  quantity: { type: Number },
  reason: { type: String },
  price: { type: Number },
  returnDate: { type: Date },
  orderDate: { type: Date },
});

const Return = mongoose.model("Return", returnSchema); // Use "Return" instead of "return" for the model name
module.exports = Return;
