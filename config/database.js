const mongoose=require("mongoose")
require("dotenv").config()
exports. dbconnect=()=>{
    mongoose.connect(process.env.MONGO_URI).then(()=>{
        console.log("database connection successfull")
    }).catch((error)=>{
        console.log(error)
        console.log("err in database connection")
    })
}