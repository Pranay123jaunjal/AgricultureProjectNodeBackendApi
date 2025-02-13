const Cart = require("../models/Cart");
const Product = require("../models/CropProduct");
const mongoose=require("mongoose")
exports.AddToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId) {
            return res.json({ success: false, message: "Product ID required" });
        } else if (!quantity) {
            return res.json({ success: false, message: "Quantity required" });
        }

        const userId = req.user.id;

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        let cart = await Cart.findOne({ user: userId }).populate("user", "first_name last_name email");

        if (!cart) {
            cart = new Cart({ user: userId, products: [] });
        }

        const productIndex = cart.products.findIndex(p => p.product.toString() === productId);

        if (productIndex > -1) {
            // Calculate the new total quantity in cart
            let newQuantity = cart.products[productIndex].quantity + quantity;

            // Check if new total quantity exceeds available stock
            if (newQuantity > product.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Stock limit exceeded. Only ${product.quantity} available.`,
                });
            } 

            // Update quantity and recalculate total price
            cart.products[productIndex].quantity = newQuantity;
            cart.products[productIndex].totalPrice = newQuantity * product.price;
        } else {
            // If adding a new product, check if quantity is within stock
            if (quantity > product.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Stock limit exceeded. Only ${product.quantity} available.`,
                });
            }

            // Add new product to cart
            cart.products.push({ product: productId, quantity, totalPrice: product.price * quantity });
        }

        await cart.save();

        // Populate user and product details
        const updatedCart = await Cart.findById(cart._id)
            .populate("user", "first_name last_name email")
            .populate("products.product", "name price status quantity");

        res.status(200).json({ message: "Product added to cart", cart: updatedCart });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error in adding product to cart", error });
    }
};




exports.viewCart = async (req, res) => {
    try {
        const user_id = req.user.id;
        const cart = await Cart.findOne({user: user_id }).populate({
            path: "products.product",
            select: "name category price"  
        });
        if (!cart) return res.status(404).json({ success: false, message: "Cart is empty" });

        res.status(200).json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateCartQuantity = async (req, res) => { 
    try {
        const { productId, quantity, operation } = req.body;
        const userId = req.user.id;

        const cart = await Cart.findOne({ user: userId }).populate("products.product", "price quantity");

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const productInCart = cart.products.find(p => p.product._id.toString() === productId);

        if (!productInCart) {
            return res.status(404).json({ success: false, message: "Product not in cart" });
        }

        const product = productInCart.product; // Reference to the product object

        if (operation === "increase") {
            const newQuantity = productInCart.quantity + quantity;
            
            // 🔹 Check stock availability before increasing quantity
            if (newQuantity > product.quantity) {
                return res.status(400).json({ success: false, message: `Only ${product.quantity} in stock` });
            }

            productInCart.quantity = newQuantity;
        } else if (operation === "decrease") {
            const newQuantity = productInCart.quantity - quantity;

            // 🔹 Ensure quantity does not go below 1
            if (newQuantity < 1) {
                return res.status(400).json({ success: false, message: "Minimum quantity must be 1" });
            }

            productInCart.quantity = newQuantity;
        } else {
            return res.status(400).json({ success: false, message: "Invalid operation type" });
        }

        // 🔹 Update total price
        productInCart.totalPrice = productInCart.quantity * product.price;
        await cart.save();

        res.status(200).json({ success: true, message: "Cart updated successfully", cart });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error updating cart quantity", error });
    }
};




exports.removeFromCart = async (req, res) => {
    try {
        const { product_id } = req.body;
        const user_id = req.user?.id; // Ensure `req.user` exists

        if (!product_id) {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }

        if (!user_id) {
            return res.status(401).json({ success: false, message: "Unauthorized user" });
        }

        // Find the cart for the user
        const cart = await Cart.findOne({ user: user_id });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        // Convert product_id to ObjectId for accurate comparison
        const productObjectId = new mongoose.Types.ObjectId(product_id);

        // Filter out the product
        const initialLength = cart.products.length;
        cart.products = cart.products.filter(p => !p.product.equals(productObjectId));

        if (cart.products.length === initialLength) {
            return res.status(404).json({ success: false, message: "Product not found in cart" });
        }

        await cart.save();

        return res.status(200).json({ success: true, message: "Product removed from cart", cart });
    } catch (error) {
        console.error("Error removing product from cart:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const user_id = req.user.id;
 
        await Cart.findOneAndDelete({user: user_id });
        res.status(200).json({ success: true, message: "Cart cleared" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
