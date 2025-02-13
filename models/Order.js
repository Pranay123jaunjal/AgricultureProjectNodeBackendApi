const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Buyer
    products: [
        {
            product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }, // Price at the time of purchase
            farmer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Seller for each product
        }
    ],
    totalAmount: { type: Number, required: true },
    orderStatus: { type: String, enum: ["pending", "shipped", "delivered", "cancelled"], default: "pending" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    paymentMethod: { type: String, enum: ["COD", "Online"], required: true }, // Cash on Delivery or Online
    transactionId: { type: String }, // If Online Payment, store transaction ID
    shippingAddress: { type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true },
    estimatedDelivery: { type: Date },
    trackingNumber: { type: String, unique: true }, // Tracking ID for shipping
    shippedAt: { type: Date }, // Timestamp for when the order is shipped
    deliveredAt: { type: Date }, // Timestamp for when the order is delivered
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null }



}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);
