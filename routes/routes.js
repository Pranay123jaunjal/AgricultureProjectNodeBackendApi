const express=require("express")
const { sendSignupOTP,verifySignupOTP,signup, login, logout } = require("../controllers/UserController");
const { verifyJwt, isFarmer, isPublic } = require("../middlewares/AuthMiddleware");
const { AddProduct, updateProduct,  SearchProducts, DeleteProduct,GetAllProducts, viewProdcutDetails } = require("../controllers/ProductController");
const { AddAddress, GetSingleAddress, UpdateAddress, DeleteAddress } = require("../controllers/AddressController");
const { AddToCart, viewCart, removeFromCart,updateCartQuantity, clearCart } = require("../controllers/CartController");
const { PlaceOrderFromCart, DirectOrder, CancelOrder } = require("../controllers/OrderController");
const { createRazorPayOrder, createPaymentLink, paymentWebhook } = require("../controllers/PaymentController");
const router=express.Router()
// // user routes
router.post("/send-otp", sendSignupOTP);   // Send OTP
router.post("/verify-otp", verifySignupOTP); //verify OTP
router.post("/register",signup)
router.post("/login",login)
router.post("/logout",verifyJwt,isFarmer,logout)

// // Product routes Farmer
router.post("/addProduct",verifyJwt,isFarmer,AddProduct)
router.post("/UpdateproductData/:id",verifyJwt,isFarmer,updateProduct)
router.delete("/DeleteProduct/:id",verifyJwt,isFarmer,DeleteProduct)
// // Product routes Public
router.get("/GetProducts",verifyJwt,isPublic,viewProdcutDetails)
router.post("/SearchProducts",verifyJwt,isPublic,SearchProducts)
router.get("/GetAllProduct",verifyJwt,isPublic,GetAllProducts)

// // user Address Routes
router.post("/addAddress", verifyJwt,AddAddress); 
router.get("/getAddress/:id",verifyJwt,GetSingleAddress)
router.post("/updateAddress/:id",verifyJwt,UpdateAddress)
router.delete("/deleteAddress/:id",verifyJwt,DeleteAddress)

// // Cart Routes
router.post("/addcart", verifyJwt,isPublic,AddToCart); 
router.get("/viewCart",verifyJwt,isPublic,viewCart)
router.post("/updateCartQuantity",verifyJwt,isPublic,updateCartQuantity)
router.delete("/deleteProductFromCart",verifyJwt,isPublic,removeFromCart)
router.delete("/clearCart",verifyJwt,isPublic,clearCart) 

// // Order Routes
router.post("/placeOrderCart", verifyJwt,isPublic,PlaceOrderFromCart); 
router.get("/DirectOrder",verifyJwt,isPublic,DirectOrder)
router.post("/cancellOrder/:id",verifyJwt,isPublic,CancelOrder)
router.delete("/deleteProductFromCart",verifyJwt,isPublic,removeFromCart)
router.delete("/clearCart",verifyJwt,isPublic,clearCart) 

// // Stripe Payments

router.post("/paymentCreate", verifyJwt,isPublic,createRazorPayOrder); 
router.post("/createPaymentlink", verifyJwt,isPublic,createPaymentLink)
router.post("/successwebhook", verifyJwt,isPublic,paymentWebhook)


module.exports={router}