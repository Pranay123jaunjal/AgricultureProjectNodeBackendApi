const razorpay = require("../config/razorpayconfig.js");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
require("dotenv").config()
const crypto = require("crypto");
const {sendEmail} = require("../utils/EmailSend.js");





exports.createRazorPayOrder = async (req, res) => {
  try {
    const { order_id } = req.body; // The order ID from your database
    console.log("order id ",order_id)

    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Create Razorpay order
    const options = {
      amount: order.totalAmount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${order._id}`,
      payment_capture: 1, // Auto-capture payment
      notes: { user_id: order.user_id.toString(), order_id: order._id.toString() }, // Optional
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      message: "Razorpay order created",
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ success: false, message: "Failed to create Razorpay order" });
  }
};




exports.createPaymentLink = async (req, res) => {
  try {
    const { order_id, email, contact } = req.body;  

    // Fetch order details
    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Create payment link
    const options = {
      amount: order.totalAmount * 100, // Convert to paise
      currency: "INR",
      accept_partial: false, // Don't allow partial payments
      description: `Payment for Order #${order._id}`,
      customer: { name: order.user_id, email, contact },
      notify: { sms: true, email: true },
      callback_url: `${process.env.NGROK_URL}/payment-success`,

      callback_method: "get",
    };

    const paymentLink = await razorpay.paymentLink.create(options);
    console.log("payment link printing",paymentLink)

    // ✅ Send Email with Payment Link
    const emailSubject = "Complete Your Payment";
    const emailText = `Click the link to complete your payment: ${paymentLink.short_url}`;
    const emailHtml = `
      <h3>Payment Required</h3>
      <p>Dear Customer,</p>
      <p>Please complete your payment for Order #${order._id}.</p>
      <p><strong>Amount:</strong> ₹${order.totalAmount}</p>
      <p><a href="${paymentLink.short_url}" target="_blank">Click here to pay</a></p>
      <p>Thank you for your order!</p>
    `;

    await sendEmail(email, emailSubject, emailText, emailHtml);

    res.status(200).json({
      success: true,
      message: "Payment link created and sent via email",
      paymentLink: paymentLink.short_url, // Send to user
      paymentLinkId: paymentLink.id,
    });

  } catch (error) {
    console.error("Error creating payment link:", error);
    res.status(500).json({ success: false, message: "Failed to create payment link" });
  }
};



exports.paymentWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;

    // ✅ Verify Razorpay Signature
    const razorpaySignature = req.headers["x-razorpay-signature"];
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (razorpaySignature !== generatedSignature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    console.log("✅ Webhook received:", req.body);

    // ✅ Extract payment details
    const { event, payload } = req.body;

    if (event === "payment_link.paid") {
      const paymentData = payload.payment_link.entity;
      const orderId = paymentData.notes.order_id; // Fetch order ID from notes
      const paymentId = paymentData.payment_id; // Razorpay payment ID
      const razorpayOrderId = paymentData.id; // Razorpay Order ID
      const amountPaid = paymentData.amount / 100; // Convert to INR
      const paymentMethod = paymentData.payment_method; // Payment method
      const currency = paymentData.currency; // Currency type

      // ✅ Fetch Order
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      // ✅ Update Order Model
      order.paymentStatus = "paid";
      order.transactionId = paymentId;
      order.orderStatus = "processing"; // Change order status
      await order.save();

      // ✅ Create or Update Payment Model
      let payment = await Payment.findOne({ order: orderId });

      if (!payment) {
        // Create a new payment entry
        payment = new Payment({
          user: order.user_id,
          order: orderId,
          amount: amountPaid,
          currency: currency,
          status: "completed",
          paymentMethod: paymentMethod,
          transactionId: paymentId,
          razorpayOrderId: razorpayOrderId,
          razorpayPaymentId: paymentId,
        });
      } else {
        // Update existing payment entry
        payment.status = "completed";
        payment.transactionId = paymentId;
        payment.razorpayOrderId = razorpayOrderId;
        payment.razorpayPaymentId = paymentId;
        payment.paymentMethod = paymentMethod;
      }

      await payment.save();

      console.log("✅ Order & Payment updated successfully:", orderId);

      res.status(200).json({ success: true, message: "Payment processed successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid event type" });
    }

  } catch (error) {
    console.error(" Webhook Error:", error);
    res.status(500).json({ success: false, message: "Webhook handling failed" });
  }
};


const axios = require("axios");

const checkPaymentStatus = async (paymentLinkId) => {
  try {
    const response = await axios.get(`https://api.razorpay.com/v1/payment_links/${paymentLinkId}`, {
      auth: {
        username: process.env.RAZORPAY_KEY_ID,
        password: process.env.RAZORPAY_KEY_SECRET
      }
    });

    if (response.data.status === "paid") {
      console.log("Payment successful for order:", response.data.notes.order_id);
      return true;
    } else {
      console.log("Payment not completed yet.");
      return false;
    }
  } catch (error) {
    console.error("Error fetching payment status:", error);
    return false;
  }
};
