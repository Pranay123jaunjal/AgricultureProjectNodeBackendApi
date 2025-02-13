const User = require("../models/User")
const OTP = require("../models/Otp")
const { ResponseErr, ResponseSuccess } = require("../utils/reponse")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
require("dotenv").config()
const {sendEmail} = require("../utils/EmailSend.js");

exports.sendSignupOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the phone number is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "email already registered!" });

    // Generate a 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60000); // OTP valid for 5 minutes

    // Remove any existing OTP for this phone before saving a new one
    await OTP.deleteMany({ email });

    //  Save OTP with phone number instead of userId
    const otp = new OTP({ email: email, otp: otpCode, expiresAt: expiresAt });
    await otp.save();




    const subject = "Your OTP Code For Verification On Farmers Ecom ";
    const message = `Your OTP code is: ${otpCode}`;
    const htmlMessage = `<h3>Your OTP code is:</h3><b>${otpCode}</b>`;

    const emailSent = await sendEmail(email, subject, message, htmlMessage);

  

    return ResponseSuccess(res, "otp send successfully on email procedd to verify otp")
  } catch (error) {
    console.log(error)
    return ResponseErr(res, "error in sending sign up otp ", error)
  }
};


exports.verifySignupOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find the OTP record for the given phone number
    const validotp = await OTP.findOne({ email, otp });

    if (!validotp) return res.status(400).json({ message: "Invalid OTP" });

    // Check if OTP is expired
    if (validotp.expiresAt < new Date()) return res.status(400).json({ message: "OTP expired" });

    // Mark OTP as verified
    validotp.verified = true;
    await validotp.save();

    res.status(200).json({ message: "OTP verified successfully. Proceed to signup." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.signup = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role } = req.body;

    //  Check if OTP was verified
    const otpRecord = await OTP.findOne({ email, verified: true });
    if (!otpRecord) return res.status(400).json({ message: "OTP not verified. Please verify first." });

    //  Check if the user already exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) return res.status(400).json({ message: "User already registered!" });

    //  Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //  Create new user
    const newUser = new User({
      first_name,
      last_name,
      email,

      password: hashedPassword,
      role,
      isVerified: true,
    });

    await newUser.save();

    // Remove OTP record after successful signup
    await OTP.deleteMany({ email });


    res.status(201).json({
      message: "User registered successfully!",
      user: { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },

    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "error occur in registering the user", error: error.message });
  }
};



exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;


    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "user not found on that email" });


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid  password" });


    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );


    res.cookie("token", token, {
      httpOnly: true,

      maxAge: 7 * 24 * 60 * 60 * 1000,
    });


    res.status(200).json({
      message: "Login successful!",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: " error in login User ", error: error.message });
  }
};


exports.logout = (req, res) => {
  try {

    res.clearCookie("token");

    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong, try again!" });
  }
};


