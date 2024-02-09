const mongoose = require("mongoose");
const { ObjectId } = require("bson");


const transactionSchema = new mongoose.Schema({
  transactionType: { type: String, enum: ['debit', 'credit'] }, // 'Credit' or 'Debit'
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  from: { type: String }, 
  orderId: { type: String }, // Change type to String
});


const walletSchema = mongoose.Schema({
  userId: {
    type: ObjectId,
    required: true,
  },
  balance: {
    type: Number,
  },
  transactions: [transactionSchema], // Array of transaction objects
});

const Wallet = mongoose.model('Wallet', walletSchema);
module.exports = Wallet;