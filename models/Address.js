const mongoose=require("mongoose")

const AddressSchema=new mongoose.Schema({
    name_city:{
        type:String,
         default:null
    },
    name_state:{
        type:String,
         default:null
    },
    street_address:{
        type:String,
         default:null
    },
    zipCode: {
         type: String,
          required: true
    },
    mobile:{
        type:Number,
         default:null
    },
    isDefault: { 
        type: Boolean,
         default: false
         },
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
       ref:"User",
        default:null
    }
})

module.exports=mongoose.model("Address",AddressSchema)