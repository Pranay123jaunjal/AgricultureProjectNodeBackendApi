const cloudinary=require("cloudinary")
const { ResponseSuccess, ResponseErr } = require("../utils/reponse")
require("dotenv").config()
exports. cloudinaryConnect=async()=>{
    try {
       await    cloudinary.config({ 
            cloud_name: process.env.CLOUD_NAME, 
            api_key: process.env.CLOUD_API_KEY, 
            api_secret: process.env.CLOUD_API_SECERET
          });
          console.log("cloudinary connect successfully")
    } catch (error) {
        console.log(error)
        return ResponseErr(res,"error in connecting cloudinary",error)
        
    }
}