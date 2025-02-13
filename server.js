const express=require("express")
const fileUpload=require("express-fileupload")
require("dotenv").config()
const cookieParser=require("cookie-parser")
const { dbconnect } = require("./config/database")
const { router } = require("./routes/routes")
const { cloudinaryConnect } = require("./config/cloudinaryConfig")
const app=express()
app.use(cookieParser())
app.use(express.json())
app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}));
const PORT=process.env.Port
app.use("/api/v1",router)
dbconnect()
cloudinaryConnect()
app.listen(PORT,()=>{
    console.log(`app is running on port ${PORT}`)
})