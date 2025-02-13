const Product = require("../models/CropProduct")
const { uploadfiletocloudinary } = require("../utils/cloudinaryImageUpload")
const { ResponseErr, ResponseSuccess } = require("../utils/reponse")


exports.AddProduct = async (req, res) => {
    try {
        const { category, name, price, description, status, quantity } = req.body
        const imagefile = req.files.CropProductImage
        const farmerid = req.user.id
        // console.log("image file __printing", imagefile)

        if (!category) {
            return ResponseErr(res, "category required", null)
        } else if (!name) {
            return ResponseErr(res, "name required", null)
        } else if (!price) {
            return ResponseErr(res, "price required", null)
        } else if (!description) {
            return ResponseErr(res, "description required", null)
        } else if (!status) {
            return ResponseErr(res, "status required", null)
        } else if (!quantity) {
            return Response(res, "quantiy is required ", null)
        }

        const uploadimage = await uploadfiletocloudinary(imagefile, "AgricultureProjectPwSkill")
        // console.log("uploaded image", uploadimage)
        const product = await Product.create({ category: category, Image_Uri:uploadimage.secure_url,name: name, price: price, farmer_id: farmerid, description: description, status: status, quantity: quantity })
             return ResponseSuccess(res,"Product Added Successful",product)
    } catch (error) {
        console.log(error)
        return ResponseErr(res, "err in adding the product", error)

    }
}


exports. updateProduct = async (req, res) => {
    try {
        const { id } = req.params||req.body; 
        // console.log("prodcut id",id)
        const {category,name,price,description,status,quantity} = req.body||req.params; 
        const farmerid=req.user.id
        const imagefile = req.files.CropProductImage
        const uploadimage = await uploadfiletocloudinary(imagefile, "AgricultureProjectPwSkill")
        // console.log("uploaded image", uploadimage)
   
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
    {  category:category,name:name,price:price,description:description,Image_Uri:uploadimage.secure_url,status:status,quantity:quantity,farmer_id:farmerid },
            { new: true, runValidators: true } 
        );
           if(!updatedProduct){
               return ResponseErr(res,"product not found ")
           }
        res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error updating product", error: error.message });
    }
};


exports. GetAllProducts = async (req, res) => {
    try {
    
        const products = await Product.find().populate("farmer_id", "name email");
        if(products.length===0){
            return ResponseErr(res,"products not found no product available")
        } 
        

        res.status(200).json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch products", error: error.message });
    }
};


exports. viewProdcutDetails = async (req, res) => {
    try {
        const { id } = req.params; // Get product ID from URL
        const product = await Product.findById(id).populate("farmer_id", "name email"); // Fetch product & populate farmer details

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.status(200).json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};




exports. SearchProducts = async (req, res) => {
    try {
        const { keyword, category, minPrice, maxPrice, status } = req.query||req.body;

    
        let filter = {};

        if (keyword) {
            filter.name = { $regex: keyword, $options: "i" }; 
        }
        if (category) {
            filter.category = category;
        }
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }
        if (status) {
            filter.status = status;
        }

        // Fetch products based on filters and populate farmer details
        const products = await Product.find(filter).populate("farmer_id", "name email");

        res.status(200).json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching products", error: error.message });
    }
};



exports.DeleteProduct=async (req,res) => {
  try {
            const {id}=req.params||req.body
            console.log("prodcut id",id)
            if(!id){
                return ResponseErr(res,"id is not comming ",null)
            }
            const  product=await Product.findOne({_id:id})
            if(!product){
                return ResponseErr(res,"product not found by that id",null)
            }
              const productid=product._id

              const deletedProduct=await Product.findByIdAndDelete(productid)
                const objproduct={
                    name:deletedProduct.name,
                    category:deletedProduct.category,
                    price:deletedProduct.price

                }
                      return ResponseSuccess(res,"product deleted successfully",objproduct)
  } catch (error) {
    console.log(error)
    return ResponseErr(res,"error in deleting the Product",error)
    
  }
}
