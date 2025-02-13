const Address = require("../models/Address");
const User = require("../models/User")




exports.AddAddress = async (req, res) => {
    try {
        const { name_city, name_state, street_address, zipCode, mobile, isDefault } = req.body;
        const userid = req.user.id;

        // Ensure user exists
        const user = await User.findById(userid);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found with that ID" });
        }

        // Ensure only one address is set as default
        if (isDefault) {
            await Address.updateMany({ user_id: userid }, { $set: { isDefault: false } });
        }

        const newAddress = new Address({
            name_city,
            name_state,
            street_address,
            zipCode,
            mobile,
            isDefault,
            user_id: userid
        });

        await newAddress.save();

        // Update User model's address array
        user.address.push(newAddress._id);
        await user.save();

        res.status(201).json({
            success: true,
            message: "Address added successfully",
            address: newAddress,
            user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "error in adding user address",
            error: error.message
        });
    }
};

exports.GetSingleAddress = async (req, res) => {
    try {
        const { id } = req.params;

        // Find address and populate the user details
        const address = await Address.findById(id).populate("user_id", "first_name last_name email");

        if (!address) {
            return res.status(404).json({ success: false, message: "Address not found on that ID" });
        }

        res.status(200).json({ success: true, message:"user adddress fetech",address });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error in fetching the single address", error: error.message });
    }
};

exports.UpdateAddress = async (req, res) => {
    try {
        const id = req.params.id || req.body.id;
        console.log("Address ID printing:", id);

        const { name_city, name_state, street_address, zipCode, mobile, isDefault } = req.body;
        console.log("req.params-->", req.params);

        const userid = req.user.id;
        const user = await User.findById(userid).select("first_name last_name email address"); // Fetch user details

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found on this ID" });
        }

        // If the address is set as default, update other addresses of the same user to false
        if (isDefault) {
            await Address.updateMany({ user_id: userid }, { $set: { isDefault: false } });
        }

        // Update address
        const updatedAddress = await Address.findByIdAndUpdate(
            id,
            { name_city, name_state, street_address, zipCode, mobile, isDefault },
            { new: true }
        );

        if (!updatedAddress) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        // Add the updated address to the user's address array if not already present
        if (!user.address.includes(updatedAddress._id)) {
            user.address.push(updatedAddress._id);
            await user.save();
        }

        // Populate the user’s name and return the response
        res.status(200).json({
            success: true,
            message: "Address updated successfully",
            address: updatedAddress,
            user: {
                _id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                address: user.address
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error in updating the address", error: error.message });
    }
};


exports.DeleteAddress = async (req, res) => {
    try {
        const { id } = req.params;

        // Find and delete the address
        const deletedAddress = await Address.findByIdAndDelete(id);

        if (!deletedAddress) {
            return res.status(404).json({ success: false, message: "Address not found on that ID" });
        }

        // Remove the deleted address ID from the user's address array
        await User.findByIdAndUpdate(deletedAddress.user_id, { 
            $pull: { address: id } 
        });

        res.status(200).json({ success: true, message: "Address deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};





