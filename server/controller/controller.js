const express = require("express");
const axios = require('axios');  
const bcrypt = require('bcrypt');      //password handler

//model
const userdbCollection = require("../model/model");      //user-register schema
const Otpdb = require("../model/userVerification");        //user-otpVerification schema
const forgotDB=require ("../model/forgotPswModel")


//nodemailer stuff
var {sendOtpMail} =require('../nodemailerStuff/email');
var {sendLinkMail} = require('../nodemailerStuff/forgotLink');
const productDB = require("../model/productModel");
const addressDb = require("../model/addressModel");




//signup-POST
const userSignup = {
    async signup(req, res) {

      try {
            //create a new user
        const email = req.body.email.trim();       //trim
        //hashing password before creating user
        const password = req.body.password;
        const hashedPassword = bcrypt.hashSync(password, 10);        //hashing psw
    
    
        if (req.body.password !== req.body.confirmPassword) {       //psw checking
          req.session.passnotmatch = true
          res.redirect("/signup")
          return
        }
        if (!/^[A-Za-z\s]+$/.test(req.body.name)) {        //name validation
          req.session.namenotvalid = true;
          res.redirect("/signup");
          return;
        }
    
        const result = await userdbCollection.findOne({ email: req.body.email });
    
        if (result) {
          //A user already exists
          req.session.userExist = true;
          res.redirect("/signup");
          return;
        }
    
        const newUser = new userdbCollection({
          name: req.body.name,
          phno: req.body.phno || null,     //if value not enter it will be null
          address: req.body.address || null,
          city: req.body.city || null,
          email: email,
          password: hashedPassword,
          confirmPassword: hashedPassword
        });
        

        const user = await newUser.save();
        //checking for middleware
        if(user){
          req.session.userRegistered = true;
        }
        // /checking
        req.session.userEmail = user.email;
        await sendOtpMail(req, res);
        console.log(user);
    
        //send otp
      
      } catch (err) {
        console.log('register err', err);
        res.send('Internal server err');
      }
    },
};


//otp-verification - POST
const otpVerification = {

  async otpSetup(req, res) {
    if(req.body.userProvidedOTP == "" && !req.query.reset){
      req.session.ProvidedOTP = 'This Field is required';                      //instead of true
      res.redirect("/otp-verification");
      console.log("This Field is required");
      return
    }
    const data = await Otpdb.findOne({_id:req.session.otpId});
    if(data){
      if(data.otp !== req.body.userProvidedOTP){
        req.session.ProvidedOTP = 'Incorrect OTP';                             //instead of true
        res.redirect("/otp-verification");
        console.log("OTP does not match");

      }else{
        try {
          // Update the 'verified' column to true in the database
          const u = await userdbCollection.updateOne({ email: req.session.userEmail }, { $set: { verified: true } });
          const userVerified = u.verified;
          console.log(u);
          res.redirect('/user-login'); // Redirect to the login page after successful OTP verification
          console.log("OTP verified successfully, 'verified' column updated to true");
        } catch (err) {
          console.error("Error updating 'verified' column:", err);
          res.status(500).send("Internal server error");
        }
      }
    }else{
      req.session.ProvidedOTP = 'OTP Expired';
      res.redirect("/otp-verification");
    }
    
  }
};

// testing
const resendOtp = {
  async otpSetup(req, res) {
    // console.log(req.body);
    console.log("email",req.body.email);
    let userEmail= req.body.email;
    if (req.query.reset) {
      console.log('this is the query', req.query.reset);
       const emaail=await Otpdb.findOne({email:req.session.userEmail});
      console.log('i found the db with email',emaail)
      const successfullydeletedDb=await Otpdb.deleteOne({emaail});
      console.log('db succesfully deleted',successfullydeletedDb);

     // // await Otpdb.updateOne({ _id: req.session.otpId }, { $set: { otp: newOtp, expirationTime: calculateExpirationTime() } });

      await sendOtpMail(req,res);
    }
  }
};


//user login-POST
const setupLogin = {
async loginUser(req, res) {
    let { email, password } = req.body;

    email = email.trim();

    // Check if the user exists
    userdbCollection.findOne({ email })
    .then(result => {
        if (result) {

          
        // User exists
        if (bcrypt.compareSync(password, result.password)) {
            console.log('Password is correct!');
            if (result.verified) {

                    if (result.isBlocked ===true) {
                      req.session.youAreBlocked = true;
                      res.redirect('/user-login')
                    }else{
                      req.session.isUserAuth = true;   //used for login msg
                      req.session.isUserAuthenticated =true    //this session used b/w login/signup middleware
                      console.log(req.session.isUserAuthenticated );
                      req.session.loginEmail= req.body.email;
                      req.session.userEmail=req.body.email //just testing

                      res.redirect('/');
                    }  
                    
            } else {
              req.session.userEmail=req.body.email
              req.session.notVerified=true
              res.redirect("/user-login")
            }
        } else {
            // Incorrect password
            req.session.passincorrect = true;
            res.redirect("/user-login");
        }
        } else {
        // Invalid credentials
        console.log("Invalid credentials entered");
        req.session.invalidCredentials = true;
        res.redirect('/user-login');
        }

    })
    .catch(err => {
        console.log(err);
        console.log("An error occurred while comparing passwords");
        res.status(500).send("Internal server error");
    });
},
};



// /user-logout - POST
const userLogout = {
  usersignout(req, res) {
    // req.session.isUserAuth = false;
    req.session.isUserAuthenticated = false;         //this session used b/w login/signup middleware
    req.session.logoutSuccess = true;

    // req.session.destroy();
    
    res.redirect("/");
  
      
  },
};


// /forgot-password - POST
const forgotPsw = {
  async pswSetup(req, res) {
    req.session.fUserEmail=req.body.email;
  
    //checking user already exist in db,otherwise cannot  update psw
      const userExist = await userdbCollection.findOne({email:req.body.email})
      if(userExist){ 

        req.session.emailLink = true; 
        req.session.backLink = true;   
        // res.redirect('/user-login')
        sendLinkMail(req, res);
        
        
        
        // res.redirect('/check-email')
        // console.log('here is the sendLinkMail:', sendLinkMail);
      }else{
        req.session.forgotUserNotExist=true
        console.log("user not exist,so cannot reset password");
        res.status(401).redirect('/forgot-password');
      }
  },
};


// /set-psw - POST
const setPsw = {
  async setNewPsw(req, res) {
    
    try{
        const newPassword = req.body.newPassword;
        const confirmNewPassword=req.body.confirmNewPassword;

        console.log('my password',req.body.confirmNewPassword);

        
        const hashedNewPassword = bcrypt.hashSync(newPassword, 10);    //hashing newpsw
        console.log('here is the hashed new password=>',hashedNewPassword);

        if (!/\S+/.test(req.body.newPassword)) {
          req.session.invalidPassword = true;
          console.log('Password must contain at least one non-space character.');
          res.redirect("/set-psw");
          return;
        }

        if(newPassword !== confirmNewPassword){           //psw checking
          req.session.fpasswordNotMatch = true;
          console.log("password not match");
          res.redirect("/set-psw");                               
        }
        else{
          const updateResult=await userdbCollection.updateOne({ email: req.session.fUserEmail },{$set: {password: hashedNewPassword,confirmPassword: hashedNewPassword}});
          console.log('my email',req.session.fUserEmail);
          // req.session.successPswReset = true;
          console.log('changed password details',updateResult);
          console.log('successfully updated the reset passwrd in userdb');
          // console.log('req.session.isUserAuthenticated',req.session.isUserAuthenticated);
          if(!req.session.isUserAuthenticated){
            console.log('psw reset success,you are not loggined,so redirecting to login)');
            req.session.successPswReset = true;
            res.redirect('/user-login');
          }else{
            console.log('psw reset success,you are already loggined,so redirecting to home(check popup)');
            req.session.successPasswordReset = true;
            res.redirect('/');
          }
        }
        
    }catch (err) {
      console.log('reset password err', err);
      res.send('Internal server err');
    }

  },
};       
  
// /shopping-cart - POST
const shoppingCart = {
  async userCart(req, res) {
    try {
    const productId = req.body.id;
    console.log('here',req.body.id);
    
    req.session.cartProductIds = req.session.cartProductIds || [];
    req.session.cartItemIds = req.session.cartProductIds || [];      //this session using in the remove item

    // check if the product ID is already in the cart
    const indexInCart = req.session.cartProductIds.indexOf(productId);

    if (indexInCart === -1) {
      // product not in the cart, add it
      req.session.cartProductIds.push(productId);           //req.session.cartProductIds-it will store an array of product IDs

      // set addToBag to true for the added product
      // const result = await productDB.findByIdAndUpdate(productId, { addToBag: true });
      const result = await productDB.findOneAndUpdate({ _id: productId },{ $set: { addToBag: true } },{ new: true });
      console.log("Product added to cart");
      console.log('addToBag result should be true', result);
    } else {
      console.log("Product is already in the cart:", productId);
    }

    res.redirect(`/single-product/${productId}`);
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).send('Internal Server Error');
  }
  },
};


// /remove-item - POST
const removeItem = {
  async moveFromCart(req, res){
    try {
    const productId = req.body.id;
    console.log('now in remove item section');

    //check if the product ID is already in the cart
    console.log('checking',req.session.cartItemIds);
    const indexToRemove = req.session.cartProductIds.indexOf(productId);
    console.log('product ID is in the cart,index of product:',indexToRemove);

    if(indexToRemove !== -1){
      //remove the product ID from the array
      req.session.cartProductIds.splice(indexToRemove, 1);
      console.log("Product removed from cart:", productId);

      // set addToBag to false for the removed product
      const result = await productDB.findOneAndUpdate({ _id: productId },{ $set: { addToBag: false } },{ new: true });
      console.log('product removed from cart');
      console.log('addToBag result should be false', result);
    }else{
      console.log("Product not found in the cart:", productId);
    }

    res.redirect('/shopping-cart');

  }catch (error){
    console.error('Error adding product to cart:', error);
    res.status(500).send('Internal Server Error');
  }
  },
};


// /wishlist - POST
const wishList = {
  async userwishlist(req, res) {
    try {
    const productId = req.body.id;
    console.log('hereeeeeeeeeeeeeeeeee',req.body.id);
    
    req.session.wishlistProductIds = req.session.wishlistProductIds || [];

    // push the product ID into the array
    req.session.wishlistProductIds.push(productId);            //req.session.cartProductIds-it will store an array of product IDs

    console.log("Product added to wishlist:", productId);
    res.redirect(`/single-product/${productId}`); 
  } catch (error) {
    console.error('Error adding product to wishlist:', error);
    res.status(500).send('Internal Server Error');
  }
  },
};
    
  
const profileEdit = {
  async userProfile(req, res) {
    try {
    const email = req.body.email;
    console.log('hereeeeeeeeeeeeeeeeee',req.body.email);
    res.redirect('/edit-profile');
  } catch (error) {
    console.error('Error while editing profile', error);
    res.status(500).send('Internal Server Error');
  }
  },
};


const saveDetails = {
  async userDetails(req, res) {
    try {
    const email = req.body.email;
    console.log('hereeeeeeeeeeeeeeeeee',req.body.email);

    //checking phno 
    if (!/^\d{10}$/.test(req.body.phno)) {
      req.session.invalidNumber = true;
      console.log('number not included 10 digits');
      res.redirect("/edit-profile");
      return;
    }
    if (!/^[A-Za-z ]{3,}$/.test(req.body.name)) {
      req.session.invalidName = true;
      console.log('Name should only contain letters');
      res.redirect("/edit-profile");
      return;
    }

    if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(req.body.name)) {
      req.session.notValidName = true;
      console.log('Name should contain at least 3 letter.');
      res.redirect("/edit-profile");
      return;
    }
    

    const updatedProfile = await userdbCollection.findOneAndUpdate({email:email}, { $set: 
              {name:req.body.name,
              phno:req.body.phno,
              email:req.body.email,
              gender:req.body.gender} }, { new: true, useFindAndModify: false });

      if (updatedProfile) {
        console.log('new profile details after updation',updatedProfile);
       console.log("profile Updated successfully");
       req.session.updatedProfile = true
       res.redirect('/user-profile');
     } else {
       console.log("profile not found or not updated");
     }
  } catch (error) {
    console.error('Error while editing profile', error);
    res.status(500).send('Internal Server Error');
  }
  },
};



const NewAddress = {
  async saveAddress(req, res) {

    try {
          //create a new address

      if (!/^\d{6}$/.test(req.body.pincode)) {
          console.log("Invalid PIN code. Please enter a 6-digit numeric PIN code");
          // req.session.invalidPIN = true;
          res.redirect("/add-address");
          return;
      }

      if (!/^[A-Za-z\s]+$/.test(req.body.state)) {
        console.log('Invalid state name,Please use only letters and spaces');
        res.redirect("/add-address");
        return;
      }
      if (!/\S+/.test(req.body.state)) {
        console.log('state must contain at least one non-space character.');
        res.redirect("/add-address");
        return;
      }

      if (!/\S+/.test(req.body.address)) {
        console.log('address must contain at least one non-space character.');
        res.redirect("/add-address");
        return;
      }

      if (!/^[A-Za-z\s]+$/.test(req.body.district)) {
        console.log('Invalid district name,Please use only letters and spaces');
        res.redirect("/add-address");
        return;
      }
      if (!/\S+/.test(req.body.district)) {
        console.log('district must contain at least one non-space character.');
        res.redirect("/add-address");
        return;
      }


      if (!/^\d{10}$/.test(req.body.mobile)) {
        req.session.invalidMobile = true;
        console.log('mobile number not included 10 digits');
        res.redirect("/add-profile");
        return;
      }

    console.log('iam comiiiiiiiiiiiiiiiiiiing hereeeeeeeeeeeeeeeeeeeeeeee');
      const mobile = req.body.mobile.trim();
      // const email = req.body.email.trim();
  
      const newAddress = new addressDb({
        pincode: req.body.pincode,
        state: req.body.state,     
        address: req.body.address,
        district: req.body.district,
        mobile: mobile,          
        addressType: req.body['address-type'],
        // email: email
      });
      console.log('hereeeeeeeeeee new address before save in mongodb',newAddress);
      console.log('iam comiiiiiiiiiiiiiiiiiiing hereeeeeeeeeeeeeeeeeeeeeeee');

      const result = await newAddress.save();
      console.log("address:",result);
      if(result){
        console.log('new address saved');
        req.session.addressSaved = true;
        res.redirect("/user-address")
      }
      
    
    } catch (err) {
      console.log('address err', err);
      res.send('Internal server err');
    }
  },
};





module.exports = { userSignup, setupLogin, otpVerification, userLogout, resendOtp, forgotPsw, setPsw, 
                  shoppingCart, removeItem, wishList, profileEdit, saveDetails, NewAddress};