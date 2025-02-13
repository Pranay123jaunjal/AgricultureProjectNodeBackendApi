const mongoose=require("mongoose")

const ProductSchema=new mongoose.Schema({
    Image_Uri:{
        type:String,
         default:null
    },
    category:{
        type:String,
        default:null
    },
    name:{
        type:String,
         default:null
    },
    price:{
        type:Number,
         default:null
    },
    description:{
        type:String,
         default:null
    },
    status:{
        type:String,
        enum:["avaliable","outOfStock"]
    },
    quantity: {
         type: Number, 
         required: true
         },
    farmer_id:{
        type:mongoose.Schema.Types.ObjectId,
       ref:"User",
        default:null
    }
})

module.exports=mongoose.model("Product",ProductSchema)