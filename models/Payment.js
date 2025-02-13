const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Who made the payment
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true }, // Linked order
    amount: { type: Number, required: true }, // Total amount paid
    currency: { type: String, default: "INR" }, // Currency

    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    }, // Payment status  

    paymentMethod: { type: String, required: true }, // Payment mode (UPI, Card, COD, etc.)

    transactionId: { type: String, unique: true, sparse: true }, // Razorpay/Bank transaction ID
    razorpayOrderId: { type: String, unique: true, sparse: true }, // Razorpay Order ID
    razorpayPaymentId: { type: String, unique: true, sparse: true }, // Razorpay Payment ID

    failureReason: { type: String }, // If failed, store the reason
    createdAt: { type: Date, default: Date.now }, // Payment time
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
