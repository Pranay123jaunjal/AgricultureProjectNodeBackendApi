const jwt = require("jsonwebtoken");
const { ResponseErr } = require("../utils/reponse");
require("dotenv").config()
exports. verifyJwt = (req, res, next) => {
    try {
          const token=req.cookies.token

        if (!token) {
            return res.status(401).json({ message: "Access Denied! No token provided.|| Please login " });
        }

        // Verify and decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Add the decoded user data to the request object
        req.user = decoded;

        next(); // Continue to the next middleware/route
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};

exports.isFarmer=(req,res,next)=>{
    try {
       if(req.user.role!=="Farmer"){
             return ResponseErr(res,"this is protected route for farmer only",null)
       }
    next()
    } catch (error) {
        console.log(error)
        return ResponseErr(res,"err in verifying farmer role")
        
    }
}
exports.isPublic=(req,res,next)=>{
    try {
       if(req.user.role!=="Public"){
             return ResponseErr(res,"this is protected route for Public only",null)
       }
    next()
    } catch (error) {
        console.log(error)
        return ResponseErr(res,"err in verifying Public role")
        
    }
}