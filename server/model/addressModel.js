const mongoose=require("mongoose");

// schema is the format of document
// User schema
const AddressDB = new mongoose.Schema({
    pincode:{
        type:String,
        required:true
     },
     state:{
        type:String,
        required:true
     },
    address:{
        type:String,
        required:true,
     },
     district:{
         type:String,
         required:true
     },
     mobile:{
         type:String,
         required: true
     },
     addressType:{
        type: String, 
        required: true
     }
});

const addressDb= new mongoose.model("addressDB",AddressDB);


module.exports = addressDb; 