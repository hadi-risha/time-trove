const mongoose = require("mongoose");

// schema is the format of document
// verification schema
const UserVerificationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: 60 * 2 
    },
});  

// const verificationCollection=new mongoose.model("VerificationCollection",UserVerificationSchema);
const Otpdb = new mongoose.model("otpDb", UserVerificationSchema);



module.exports = Otpdb;