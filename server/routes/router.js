const express = require("express");
const router = express.Router();
const axios = require('axios');
const multer = require("multer");
const productDB =require("../model/productModel")
const store = require("../middlewares/multer")               //multer middleware
updateProduct
//all GET requests
const {getUserSignup, getOtpPage, getUserLogin, getHome,getForgotPsw, getPswSetup,
   getAllWatches, getAdminLogin,getAdminHome, getuserManagement, getAdminAddProduct,
   getProductManagement, getSingleProduct ,getAdminUnlistedProduct,
    getUpdateProduct, getCategoryManagement,getUnlistedCategory, getAddCategory,
     getMenswatches, getWomenswatches, getShoppingCart, getWishlist,
     getUserProfile, getUserEditProfile, getAddAddress, getUserAddress, 
                                getAddressImage} = require('../services/render');


// const {isAuthenticate}= require('../middlewares/middlewares')

//This is user controller
var {userSignup,setupLogin, otpVerification, userLogout, resendOtp, forgotPsw, setPsw, shoppingCart,
                          wishList, profileEdit, saveDetails, NewAddress, removeItem}=require('../controller/controller');

//this is admin controller
var { adminLoginPost,
   adminLogout, addproduct, userManagement, blockUnblockUser, deleteProduct,
                  recoverProduct, updateProduct, addCategory,
                   deleteCategory, recoverCategory, deleteImage }=require('../controller/adminController');


const userdbCollection = require("../model/model");



// here comes nodemailer-email stuff


// custom user middlewares
   

    //check user already registered
    function alreadyExist(req,res,next){
      if(req.session.userRegistered){
        res.redirect('/user-login')
        console.log('user already exist,so cannot access signup');
        return
      }else{
        console.log('user not exist,proceed to the signup route')
        next();
      }
    }

    //function if loggined then cannot access login and signup
    function useralreadyloggined(req,res,next){
      if(req.session.isUserAuthenticated){
        console.log(req.session.isUserAuthenticated);
        res.redirect('/');
        console.log('you are already logged in');
      }else{
        console.log(req.session.isUserAuthenticated);
        console.log('you are not loggedin');
        next();
      }
    }
    
     //function if not loggined then cannot access any otherpages
     function notAuth(req,res,next){
      if(!req.session.isUserAuth){
        res.redirect('/user-login');
        console.log('you are not auth');
      }else{
        next(); 
      }
    }

    //function if user not registered then cannot access otp page
    function notRegistered(req,res,next){
      if(!req.session.userRegistered){
        res.redirect('/signup');
        console.log('youre not registered');
      }else{
        console.log('youre are already registered');
        next();
      }
    }


    
    //function if set-psw link not shared through email then cannot access set-psw page
    function sendpswLink(req,res,next){
      console.log('comeeeeeeeeeeeeeeeeeeeeeeeeeeee',req.session.emailLink);
      if(req.session.emailLink){
        next();
        console.log('link shared,please check email');
      }else{
        console.log('link not shared, so cannot access set-psw page');
        res.redirect('/user-login')
      }
    }
    // function sendpswLink(req,res,next){
    //   console.log('comeeeeeeeeeeeeeeeeeeeeeeeeeeee',req.session.emailLink);
    //   if(!req.session.emailLink){
    //     res.redirect('/user-login');
    //     console.log('youre email not registered');
    //   }else{
    //     console.log('link shared,please check email');
    //     next();
    //   }
    // }
  

  //  otp
  // if user not vetfied-then give access to otp 
  async function otpAccess(req,res,next){
    // const data = await userdbCollection.find({ email: req.session.userEmail });
    if(req.session.userRegistered){
      console.log("you can verify now");
      next()
    }else{
      res.redirect("/user-login")
      console.log("can't verify or already verified");
    }       
  }

  // if user registered-then give access to otp 
  async function otpAccessAddit(req,res,next){
    if(req.session.userRegistered){
      console.log("you are registered,you can verify now");
      next()
    }else{
      res.redirect("/user-login")
      console.log("youre not registered,cannot access otp");
    }       
  }
  
//if already loggined user blocked make the user signout out and show message
  async function blockedUser(req,res,next){
    if(req.session.userBlocked= true){
    req.session.isUserAuthenticated = false;
    console.log('user blockeddd');
    req.session.blockedUser = true;   //creating here a session to show  messages mgs
    res.redirect("/")
  } else {
    console.log('user not blockeddd');
    next()
  }
}
 
    
    
// end of custom user middlewares

/************* userSide Routes ****************/ useralreadyloggined
router.get('/signup', useralreadyloggined,alreadyExist,  getUserSignup.getSignupPage);        //render.js

router.post('/signup', userSignup.signup);               //controller

router.get('/otp-verification',otpAccess,otpAccessAddit,useralreadyloggined,getOtpPage.otpPage);        //render.js

router.post('/otp-verification',otpVerification.otpSetup);       //controller

// testing
router.post('/otp-reset', resendOtp.otpSetup);
// /testing

router.get('/user-login',useralreadyloggined, getUserLogin.getLoginPage);          //render.js

router.post('/user-login', setupLogin.loginUser);             //controller

router.get('/', getHome.renderHome);                 //render.js

router.post("/user-logout", userLogout.usersignout);
   
router.get('/forgot-password',getForgotPsw.forgotPsw);               //render.js 

router.post('/forgot-password',forgotPsw.pswSetup);

// router.get('/check-email',checkEmailPage.checkpage);            //middle page between forgot and reset psw

router.get('/set-psw',sendpswLink, getPswSetup.setNewPsw);              //render.js

router.post('/set-psw',setPsw.setNewPsw);            //pending

router.get('/all-watches', getAllWatches.allWatches);          //render.js

router.get('/single-product/:id', getSingleProduct.singleProd);          //render.js

router.get('/mens-watches', getMenswatches.menswatch); 

router.get('/womens-watches', getWomenswatches.womenswatch); 

router.get('/shopping-cart', getShoppingCart.shoppingCart); 

router.post('/shopping-cart', shoppingCart.userCart); 

router.post('/remove-item', removeItem.moveFromCart)

router.get('/wishlist', getWishlist.wishlist); 

router.post('/wishlist', wishList.userwishlist); 

router.get('/user-profile', getUserProfile.userProfile);

router.post('/profile-edit', profileEdit.userProfile);

router.get('/edit-profile', getUserEditProfile.EditProfile);

router.post('/save-profileDetails', saveDetails.userDetails);

router.get('/add-address', getAddAddress.userAddress);

router.post('/save-address', NewAddress.saveAddress);

router.get('/user-address', getUserAddress.userAddress);

router.get('/address-image', getAddressImage.addressImage);



/************* /userSide Routes ****************/






/************* adminSide Routes ****************/

// custom admin middlewares
function notAuthenticate(req, res, next) {
  if (req.session.isAuth) {
    res.redirect("/adminHome");
  } else {
    next();
  }
}

function notUserAuthenticate(req, res, next) {
  if (req.session.isUserAuth) {
    res.redirect("/");
  } else {
    next();
  }
}

function isAuthenticate(req, res, next) {
  if (req.session.isAuth) {
    next();
  } else {
    res.redirect("/admin");
  }
}

function isUserAuthenticate(req, res, next) {
  if (req.session.isUserAuth) {
    next();
  } else {
    res.redirect("/login");
  }
}
// end of custom admin middlewares

router.get('/admin',notAuthenticate, notUserAuthenticate, getAdminLogin.adminLogin);         //admin login - GET

router.post("/admin", adminLoginPost.adminlogin);                                          //admin login - POST

router.get("/adminHome",isAuthenticate,  getAdminHome.adminHome);       //here                              

router.post("/ad-logout", adminLogout.adminsignout);

//add product
router.get("/add-product",isAuthenticate, getAdminAddProduct.addProduct);

router.post('/add-product',store.array('images',5),addproduct.addProd);      //images is the img input fieldname and 15 is the limit,the middleware create a file method.

//user-management
router.get("/user-management",isAuthenticate,  getuserManagement.uManagement);

router.post("/user-management",userManagement.uManagement);   // no need

router.post('/user-management/:userId',isAuthenticate, blockUnblockUser.userManage);  


//Product Management
router.get("/adminProductManagement",isAuthenticate,  getProductManagement.productManage );

// router.post("/adminProductManagement");

router.get("/adminUnlisted-product",isAuthenticate,  getAdminUnlistedProduct.unlistedProduct);

router.get("/update-product",isAuthenticate,  getUpdateProduct.updateProduct); //dont change anything here

router.post("/update-product", store.array('images',5),updateProduct.updateProd);        //must add multer(also include in ejs) middleware,otherwise get error

// router.post("/update-deleteImage",deleteImage.deleteImg)

router.post("/delete-product", deleteProduct.deleteProd);

router.post("/recover-product", recoverProduct.recoverProd);





//Category Management
router.get("/category-management",isAuthenticate, getCategoryManagement.categoryManagement);  

router.get("/unlisted-category",isAuthenticate, getUnlistedCategory.unlistedCategory);

router.get("/add-category", isAuthenticate, getAddCategory.addCategory);

router.post("/add-category", addCategory.addCat);

router.post("/delete-category", deleteCategory.removeCat);

router.post("/recover-category", recoverCategory.recoverCat);




/************* /adminSide Routes ****************/


module.exports = router;