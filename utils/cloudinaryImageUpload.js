const { ResponseErr, ResponseSuccess } = require("./reponse")
const cloudinary = require('cloudinary').v2;

exports.uploadfiletocloudinary=async(file,folder)=>{
try {
        const options={folder}
        // console.log("this is options : ",options)
        options.resource_type="auto"
        // console.log("temp file path ",file.tempFilePath)
           return await cloudinary.uploader.upload(file.tempFilePath,options)
         
          
} catch (error) {
    console.log(error)
    console.log("erro in uploading to cloudinary")
    
}
 }