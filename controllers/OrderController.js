const Order = require("../models/Order");
const Cart = require("../models/Cart");
const {sendEmail} = require("../utils/EmailSend"); 
const User = require("../models/User")
const Product = require("../models/CropProduct")
exports.PlaceOrderFromCart = async (req, res) => {
    try {   
        const user_id = req.user.id;
        const { shippingAddress, paymentMethod } = req.body;

        // Fetch user details
        const user = await User.findById(user_id);
        console.log("user logging",user)
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Fetch cart details
        const cart = await Cart.findOne({ user: user_id })
        .populate({ path: "products.product_id", strictPopulate: false });
    
        console.log("cart printing ",cart)
        if (!cart || cart.products.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        let totalAmount = 0;
        const orderProducts = [];

        // Check stock and prepare order details
        for (const item of cart.products) {
            if (!item.product) {
                return res.status(400).json({ success: false, message: "Invalid product in cart" });
            }
            const product = await Product.findById(item.product._id);
            if (!product) return res.status(404).json({ success: false, message: `Product not found: ${item.product._id}` });

            if (product.quantity < item.quantity) {
                return res.status(400).json({ success: false, message: `Not enough stock for ${product.name}` });
            }

            // Deduct stock
            product.quantity -= item.quantity;
            await product.save();

            // Calculate total amount
            totalAmount += product.price * item.quantity;

            // Add product details to order array
            orderProducts.push({
                product_id: product._id,
                quantity: item.quantity,
                price: product.price,
                farmer_id: product.farmer_id,
            });
        }

        // Generate estimated delivery date
        const estimatedDeliveryDate = new Date();
        estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);

        // Generate unique tracking number
        const trackingNumber = `TRK${Date.now()}${Math.floor(Math.random() * 1000)}`;

        // ✅ Step 1: Create Order
        const order = new Order({
            user_id,
            products: orderProducts,
            totalAmount,
            orderStatus: "pending",
            paymentStatus: paymentMethod === "COD" ? "pending" : "unpaid",
            paymentMethod,
            shippingAddress,
            estimatedDelivery: estimatedDeliveryDate,
            trackingNumber,
        });

        await order.save();
        await Cart.findOneAndDelete({ user_id }); // Clear cart after order

        console.log(`Order placed! Order ID: ${order._id}, Total Amount: ${totalAmount}`);

        // ✅ Step 2: Create Payment Entry (Only for Online Payments)
        if (paymentMethod === "Online") {
            const payment = new Payment({
                user: user_id,
                order: order._id, // Store order ID in payment
                amount: totalAmount,
                paymentMethod,
                status: "pending",
            });
            await payment.save();
            console.log(`Payment entry created with ID: ${payment._id}`);
        }

        // ✅ Step 3: Send Email for COD Orders
        if (paymentMethod === "COD") {
            const emailSubject = "Order Confirmation";
            const emailText = `Your order has been placed successfully! Tracking ID: ${order.trackingNumber}`;
            const emailHtml = `
                <h3>Order Confirmation</h3>
                <p>Dear ${user.first_name},</p>
                <p>Your order has been placed successfully.</p>
                <p><strong>Tracking ID:</strong> ${order.trackingNumber}</p>
                <p><strong>Estimated Delivery:</strong> ${order.estimatedDelivery.toDateString()}</p>
                <p>Thank you for shopping with us!</p>
            `;

            await  sendEmail(user.email, emailSubject, emailText, emailHtml);
        }
        const populatedOrder = await Order.findById(order._id).populate("shippingAddress");
        res.status(200).json({ success: true, message: "Order placed successfully", order: populatedOrder });
        
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ success: false, message: "err in creating the order" });
    }
};




exports.DirectOrder = async (req, res) => {
    try {
        const { product_id, quantity, shippingAddress, paymentMethod } = req.body;
        const user_id = req.user.id;
        const user = await User.findById(user_id);

        // Fetch product
        const product = await Product.findById(product_id);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        // Check stock
        if (product.quantity < quantity) return res.status(400).json({ success: false, message: "Not enough stock" });

        // Deduct stock
        product.quantity -= quantity;
        await product.save();

        // Generate tracking number
        const trackingNumber = `TRK${Date.now()}${Math.floor(Math.random() * 1000)}`;

        // Create order
        const order = new Order({
            user_id,
            products: [{ product_id, quantity, price: product.price, farmer_id: product.farmer_id }],
            totalAmount: product.price * quantity,
            orderStatus: "pending",
            paymentStatus: paymentMethod === "COD" ? "pending" : "unpaid",
            paymentMethod,
            shippingAddress,
            estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            trackingNumber,
        });

        await order.save();

        // ✅ Create Payment entry for tracking
        const payment = new Payment({
            user: user_id,
            order: order._id, // Linking payment to the order
            amount: order.totalAmount,
            paymentMethod,
            status: paymentMethod === "COD" ? "pending" : "unpaid",
        });

        await payment.save();

        // Prepare email content
        const emailSubject = "Order Confirmation";
        const emailText = `Your order has been placed successfully! Tracking ID: ${order.trackingNumber}`;
        const emailHtml = `
            <h3>Order Confirmation</h3>
            <p>Dear ${user.name},</p>
            <p>Your order has been placed successfully.</p>
            <p><strong>Tracking ID:</strong> ${order.trackingNumber}</p>
            <p><strong>Estimated Delivery:</strong> ${order.estimatedDelivery.toDateString()}</p>
            <p>Thank you for shopping with us!</p>
        `;

        // Send email for COD orders immediately
        if (paymentMethod === "COD") {
            await sendEmail(user.email, emailSubject, emailText, emailHtml);
        }

        res.status(200).json({ success: true, message: "Order placed successfully", order, payment });

    } catch (error) {
        console.error("Error placing direct order:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};



exports.CancelOrder = async (req, res) => {
    try {
        const user_id = req.user.id;  // Get user ID from authenticated request
        const  order_id  = req.params.id;  // Get order ID from request params
console.log("order id pirinting",order_id)
        // Find the order
        const order = await Order.findOne({ _id: order_id, user_id:user_id }).populate("products.product_id");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Check if order is still cancellable
        if (order.orderStatus !== "pending") {
            return res.status(400).json({ success: false, message: "Order Already be cancelled" });
        }

        // Restore product stock
        for (const item of order.products) {
            const product = await Product.findById(item.product_id);
            if (product) {
                product.quantity += item.quantity; // Restore stock
                await product.save();
            }
        }

        // If payment was made online, process refund
        if (order.paymentMethod === "Online" && order.paymentStatus === "paid") {
            const payment = await Payment.findOne({ order: order_id });

            if (payment && payment.transactionId) {
                const refund = await processRefund(payment.transactionId, order.totalAmount); // Implement processRefund()
                
                if (!refund.success) {
                    return res.status(500).json({ success: false, message: "Failed to process refund" });
                }

                payment.status = "refunded";
                await payment.save();
            }
        }

        // Update order status to "cancelled"
        order.orderStatus = "cancelled";
        order.cancelledAt =new Date();
        order.cancellationReason = req.body.cancellationReason || "Not specified";

        order.paymentStatus = order.paymentMethod === "Online" ? "refunded" : "pending";
        await order.save();

        // Send Email Notification
        const user = await User.findById(user_id);
        if (user) {
            const emailSubject = "Order Cancellation Confirmation";
            const emailText = `Your order (Tracking ID: ${order.trackingNumber}) has been successfully cancelled.`;
            const emailHtml = `
                <h3>Order Cancellation Confirmation</h3>
                <p>Dear ${user.first_name},</p>
                <p>Your order has been successfully cancelled.</p>
                <p><strong>Tracking ID:</strong> ${order.trackingNumber}</p>
                <p>If you have already made a payment, it will be refunded soon.</p>
                <p>We apologize for any inconvenience caused.</p>
                <p>Thank you for shopping with us!</p>
            `;

            await sendEmail(user.email, emailSubject, emailText, emailHtml);
        }

        res.status(200).json({ success: true, message: "Order cancelled successfully. Email sent.", order });
    } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ success: false, message: "Error in cancelling the order" });
    }
};




// exports.getMySales = async (req, res) => {
//     try {
//         const farmerId = req.user?.id; // Ensure req.user exists

//         if (!farmerId) {
//             return res.status(401).json({ success: false, message: "Unauthorized access" });
//         }

//         // Fetch all products listed by the farmer
//         const products = await Product.find({ farmer_id: farmerId });

//         if (!products.length) {
//             return res.status(404).json({ success: false, message: "No products found for this farmer" });
//         }

//         // Fetch orders where products belong to the farmer
//         const orders = await Order.find({ "products.product": { $in: products.map(p => p._id) } })
//             .populate("products.product", "name price")
//             .populate("user", "name email");

//         if (!orders.length) {
//             return res.status(404).json({ success: false, message: "No sales found for this farmer" });
//         }

//         res.status(200).json({
//             success: true,
//             message: "My sales data retrieved successfully",
//             products,
//             orders
//         });

//     } catch (error) {
//         console.error("Error fetching My Sales data:", error);
//         res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
//     }
// };
