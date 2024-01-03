const categoryDB = require("../model/categoryModel");
const userdbCollection = require("../model/model");
const productDB = require("../model/productModel");
var {sendOtpMail} =require('../nodemailerStuff/email');

/************* User side ****************/

//signup-GET
const getUserSignup = {
    getSignupPage(req, res) {
        res.render("signup", {passError: req.session.passnotmatch,nameError: req.session.namenotvalid,userExistError: req.session.userExist}, (error, data) => {
        if (error) {
            return res.status(500).send("Internal server error");
        }
        delete req.session.passnotmatch;
        delete req.session.namenotvalid;
        delete req.session.userExist;
        res.send(data);
        });
    },
};


//otp-verification - GET
const getOtpPage={
    async otpPage(req,res){
         if(req.query.checkVerify){
           console.log("it's coming here but not working");
           console.log('reg is',req);
           await sendOtpMail(req,res);
           return;
         }
            res.render("otp_verification",{otpError: req.session.ProvidedOTP, userEmail:req.session.userEmail},(error, data) => {
                if (error) {
                return res.status(500).send("Internal server error shown");
                }
                delete req.session.ProvidedOTP;    //for delete incorrect otp msg,coz show msg only one time after reload need fresh page
                res.send(data)
            });     
    }
};



//user login-GET
const getUserLogin = {
    async getLoginPage(req, res) {

        //reset password success message
        // const PswResetSuccess = req.session.successPswReset;
        let resetMessageDisplayed = req.session.resetpswSuccessMsgDisplayed;
        if (req.session.successPswReset && !resetMessageDisplayed) {
            req.session.resetpswSuccessMsgDisplayed = true;      //created here
        }else{
            req.session.resetpswSuccessMsgDisplayed = false
            resetMessageDisplayed = false
        }

        
        //user blocked message
        // const blockedSuccess = req.session.youAreBlocked;
        let blockMessageDisplayed = req.session.blockSuccessMsgDisplayed;
        if (req.session.youAreBlocked && !blockMessageDisplayed) {
            req.session.blockSuccessMsgDisplayed = true;      //created here
        }else{
            req.session.blockSuccessMsgDisplayed = false
            blockMessageDisplayed = false
        }

        res.render("user_login", {blockMessageDisplayed, blockedSuccess: req.session.youAreBlocked, PswResetSuccess: req.session.successPswReset,
                                    resetMessageDisplayed, verifiedError: req.session.notVerified,logpassError: req.session.passincorrect,
                                    logemailError: req.session.emailincorrect,credentialError: req.session.invalidCredentials
                }, (error, data) => {
                if (error) {
                    return res.status(500).send("Internal server error");
                }
                req.session.resetpswSuccessMsgDisplayed = false;
                delete req.session.successPswReset;

                req.session.blockSuccessMsgDisplayed = false;
                delete req.session.youAreBlocked;

                delete req.session.notVerified;
                delete req.session.passincorrect;
                delete req.session.emailincorrect;
                delete req.session.invalidCredentials;
                res.send(data);
                });
    },
};




//home-GET
const getHome = {
    async renderHome(req, res) {
        try {
        // const loginSuccess = req.session.isUserAuth;
        let messageDisplayed = req.session.successMessageDisplayed; // check if the success message has already been displayed
        if (req.session.isUserAuth && !messageDisplayed) {    // Set a session variable to track that the message has been displayed
            req.session.successMessageDisplayed = true;    //session created here
            
            console.log('login message');
        }else{
            req.session.successMessageDisplayed = false;
            messageDisplayed = false;
        }

        // //reset password success message 
        // // const PswResetSuccess = req.session.successPasswordReset;
        // let resetMessageDisplayed = req.session.resetpswSuccessMsgDisplayed;
        // if (req.session.successPasswordReset && !resetMessageDisplayed) {
        //     req.session.resetpswSuccessMsgDisplayed = true;      //created here
        //     console.log('psw reset msg');
        // }else{
        //     req.session.resetpswSuccessMsgDisplayed = false
        //     resetMessageDisplayed = false
        // }
       

        const result = await userdbCollection.findOne({ email: req.session.userEmail });

        if (result) {
            console.log('data',result.name,  result.email);
        } else {
            console.log('User not found');
        }
        
        //logout success message
        // const logoutSuccess = !req.session.isUserAuth;
        // const logoutMessageDisplayed = req.session.logoutSuccessMsgDisplayed;
        // if (logoutSuccess && !logoutMessageDisplayed) {
        //     req.session.logoutSuccessMsgDisplayed = true;
        // }
        res.render('home', {PswResetSuccess: req.session.successPasswordReset,
                             userName: result? result.name : 'User not found', userLoggined: req.session.isUserAuthenticated,
                              loginSuccess: req.session.isUserAuth, messageDisplayed, logoutSuccess: req.session.logoutSuccess }, (err, html) => {
            if (err) {
              return res.send('Render err');
            }
                req.session.successMessageDisplayed = false;
                delete req.session.isUserAuth;
                // req.session.isUserAuthenticated;
            
                delete req.session.logoutSuccess;

                // req.session.resetpswSuccessMsgDisplayed = false
                delete req.session.successPasswordReset;
            res.send(html);
          });

    
        } catch (error) {
          console.error('Error retrieving user:', error);
          res.render('error', { message: 'Error retrieving user' });
        }
      },
    };



//forgot-psw - GET
const getForgotPsw={
    forgotPsw (req,res) {

        //email sended success message
        // const emailSuccess = req.session.emailLink;
        let messageDisplayed = req.session.successMessageDisplayed;            // Check if the success message has already been displayed
        if (req.session.backLink && !messageDisplayed) {                       // Set a session variable to track that the message has been displayed
        req.session.successMessageDisplayed = true;       //created here
        }
        else {
            req.session.successMessageDisplayed = false;
            messageDisplayed = false;
        }


        res.render("forgot_psw",{emailSuccess:req.session.backLink, messageDisplayed, usernotExist:req.session.forgotUserNotExist},
        (error, data) => {
            if (error) {
              return res.status(500).send("Internal server error");
            }
            req.session.successMessageDisplayed = false;
            delete req.session.forgotUserNotExist;
            delete req.session.backLink;
            res.send(data);
            });
    }
}


//forgot psw - GET
const getPswSetup={
    async setNewPsw (req,res) {
        res.render("set_psw", {invalidPassword: req.session.invalidPassword,userEmail:req.session.userEmail,passwordNotMatch:req.session.fpasswordNotMatch},
        (error, data) => {
            if (error) {
              return res.status(500).send("Internal server error");
            }
            delete req.session.invalidPassword;
            delete req.session.fpasswordNotMatch;
            res.send(data);
            }
        );
    }
}


//allWatches-GET
const getAllWatches = {
    async allWatches(req, res) {
        try {
            const allProductDetails = await productDB.find(); // Fetch all products from MongoDB
            // console.log(allProductDetails.category);
            res.render("all_watches", { allProductDetails }); 
          } catch (error) {
            console.error('Error fetching products from MongoDB:', error);
            res.status(500).send('Internal Server Error');
          }
    },
}; 





///single-product-GET
const getSingleProduct = {
    async singleProd(req, res) {
        try {
            const id = req.params.id;
            const allProductDetails = await productDB.findOne({ _id: id });
            // console.log('here is the image',allProductDetails.images);
            res.render("single_product", { allProductDetails });
        } catch (error) {
            console.error('Error fetching product details:', error);
            res.status(500).send('Internal Server Error');
        }


    },
};


///mens watches-GET
const getMenswatches = {
    async menswatch(req, res) {
        try {
            const allProductDetails = await productDB.find(); // Fetch all products from MongoDB
            // console.log(allProductDetails.category);
            res.render("mens_watches", { allProductDetails }); 
          } catch (error) {
            console.error('Error fetching products from MongoDB:', error);
            res.status(500).send('Internal Server Error');
          }
    },
};

///womens watches-GET
const getWomenswatches = {
    async womenswatch(req, res) {
        try {
            const allProductDetails = await productDB.find(); // Fetch all products from MongoDB
            // console.log(allProductDetails.category);
            res.render("womens_watches", { allProductDetails }); 
          } catch (error) {
            console.error('Error fetching products from MongoDB:', error);
            res.status(500).send('Internal Server Error');
          }
    },
};

///shopping-cart -GET
const getShoppingCart = {
    async shoppingCart(req, res) {
        try {
            const productIds = req.session.cartProductIds || [];

            console.log('product ids',productIds);


            // fetch all products corresponding to the IDs in the cart
            const cartProductDetails = await productDB.find({ _id: { $in: productIds } });

            if (!cartProductDetails || cartProductDetails.length === 0) {
                //when cartProductDetails is null or empty
                return res.status(404).send("Products not found in the cart");
            }
            console.log('Cart Product Details:',cartProductDetails);


            // fetch all products corresponding to the IDs in the cart where addToBag is true
            const addToBagStatus = await productDB.find({
                _id: { $in: productIds },
                addToBag: true
            });
            if(addToBagStatus){
                console.log('its here addtobag status', addToBagStatus);
            }else{
                console.log('couldnt find addto bag status');
            }
            console.log('chechinggggggggggggggggggggggggggggggggggggg here:::::::', addToBagStatus);

            res.render('shopping_cart', { cartProductDetails});
        } catch (error) {
            console.error('Error fetching product details:', error);
            res.status(500).send("Internal server error");
        }
    },
};





///wishlist -GET
const getWishlist = {
    async wishlist(req, res) {

        try {
            const productIds = req.session.wishlistProductIds || [];

            console.log('product Ids',productIds);

            // fetch all products corresponding to the IDs in the wishlist
            const wishlistProductDetails = await productDB.find({ _id: { $in: productIds } });

            // if (!wishlistProductDetails || wishlistProductDetails.length === 0) {
            //     //when wishlistProductDetails is null or empty
            //     return res.status(404).send("Products not found in the wishlist");
            // }

            // console.log('wishlist Product Details', wishlistProductDetails);

            res.render('wishlist', { wishlistProductDetails });
        } catch (error) {
            console.error('Error fetching product details:', error);
            res.status(500).send("Internal server error");
        }
    },
};

///user_profile -GET
const getUserProfile = {
    async userProfile(req, res) {
        try {
            const result = await userdbCollection.findOne({ email: req.session.userEmail });
          
            if (result) {
              console.log('emaileee', req.session.userEmail, result.name, result.email, result.phno);
              req.session.emailee= result.email
            }else{
              console.log('User not found');
            }

            res.render('user_profile',{userGender: result.gender, userName: result.name, userEmail: result.email, userNumber: result.phno}, (err, html) => {
                if(err){
                    return res.send('Render err');
                }
                res.send(html);
            });
          }catch(error) {
            console.error('Error retrieving user:', error);
          } 
    },
};


///edit-profile -GET
const getUserEditProfile = {
    async EditProfile(req, res) {
        try {
            const result = await userdbCollection.findOne({ email: req.session.userEmail });
          
            if (result) {
              console.log('emaileee', req.session.userEmail, result.name, result.email, result.phno);
            }else{
              console.log('User not found');
            }
            console.log('ogppppppppp', req.session.userEmail);
            res.render('edit_profile',{notValidNameError: req.session.notValidName, invalidNameError: req.session.invalidName,invalidNoError: req.session.invalidNumber, userGender: result.gender, userName: result.name, userEmail: result.email, userNumber: result.phno}, (err, html) => {
                if(err){
                    return res.send('Render err');
                }
                delete req.session.invalidNumber;
                delete req.session.invalidName;
                delete req.session.notValidName
                res.send(html);
            });
          }catch(error) {
            console.error('Error retrieving user:', error);
          } 
    },
};



///add-address -GET
const getAddAddress = {
    async userAddress(req, res) {
        try {

            const result = await userdbCollection.findOne({ email: req.session.userEmail });
            if (result) {
                console.log('emaileee', req.session.userEmail, result.name, result.email, result.phno);
              }else{
                console.log('User not found');
              }
              res.render('add_address',{userName: result.name, userEmail: result.email}, (err, html) => {
                if(err){
                    return res.send('Render err');
                }
                res.send(html);
            });
        }catch(error) {
        console.error('Error retrieving user:', error);
        } 
    },
};

///user-address -GET
const getUserAddress = {
    async userAddress(req, res) {
        try {

            const result = await userdbCollection.find({ email: req.session.userEmail });
            if (result) {
                console.log('emaileee', req.session.userEmail, result.name, result.email, result.phno);
              }else{
                console.log('User not found');
              }
              res.render('user_address',{userName: result.name, userEmail: result.email}, (err, html) => {
                // res.render('user_address')
                if(err){
                    return res.send('Render err');
                }
                res.send(html);
            });
        }catch(error) {
        console.error('Error retrieving user:', error);
        } 
    },
};


///user-address -GET
const getAddressImage = {
    addressImage(req, res) {
        res.render('address_image')
    },
};



          
  


/************* end of User side ****************/






/************* Admin side ****************/

//admin - GET     (login) 
const getAdminLogin = {
    adminLogin(req, res) {
        res.render('admin',{adminPassError:req.session.invalidCredentials}, (error, data) => {
            if (error) {
                return res.status(500).send("Internal server error");
            }
            delete req.session.invalidCredentials;
            res.send(data);
        });
    },
};

//adminHome - GET
const getAdminHome = {
    adminHome(req, res) {
        // axios
  //   .get("http://localhost:1005/api/users")
  //   .then(function (response) {
  //     res.render("adminHome", { users: response.data });
  //   })
  //   .catch((err) => {
  //     res.send(err);
  //   });

  // res.render("adminHome")
    res.render("admin_dashboard",{AdminPassError:req.session.adminPassnotMatch},)
    },
};

//user-management - GET
const getuserManagement = {
    uManagement: async (req, res) => {
        const email = req.query.email;
        try{
            const userDetails = await userdbCollection.find();

            res.render('user_management', { userDetails });
            console.log('User Details:', userDetails);

        } catch(err) {
            console.log('register err', err);
        }
        
    },
};


//add-product - GET
const getAdminAddProduct = {
    async addProduct(req, res) {
        try{
            const allCategories = await categoryDB.find(); // Fetch all products from MongoDB

            //product added success message
            // let addproductSuccess = req.session.productAdded;
            let messageDisplayed = req.session.successMessageDisplayed;
            if (req.session.productAdded && !messageDisplayed) {                       // Set a session variable to track that the message has been displayed
                req.session.successMessageDisplayed = true;       //created here
                }
                else {
                    req.session.successMessageDisplayed = false;
                    messageDisplayed = false;
                }

                res.render("add_product", { addproductSuccess: req.session.productAdded, messageDisplayed, allCategories }, (error, data) => {
                    if (error) {
                        return res.status(500).send("Internal server error");
                    }
                    req.session.successMessageDisplayed = false;
                    delete req.session.productAdded;
                    res.send(data);
                });
          }catch (error) {
            console.error('Error fetching products from MongoDB:', error);
            res.status(500).send('Internal Server Error');
          }
    },
};




///adminProductManagement - GET   
const getProductManagement = {
    async productManage (req, res) {
        try {
            const allProductDetails = await productDB.find(); // Fetch all products from MongoDB
            // console.log(allProductDetails.category);

            //product updated success message
            // let productUpdateSuccess = req.session.productUpdated;
            let messageDisplayed = req.session.successMessageDisplayed;
                if (req.session.productUpdated && !messageDisplayed) {                       // Set a session variable to track that the message has been displayed
                    req.session.successMessageDisplayed = true;       //created here
                }
                else {
                    req.session.successMessageDisplayed = false;
                    messageDisplayed = false;
                }

            //product deleted success message
            // let productDeleteSuccess = req.session.productDeleted;
            let deletedMessageDisplayed = req.session.deletedMessageDisplayed;
                if (req.session.productDeleted && !deletedMessageDisplayed) {                       // Set a session variable to track that the message has been displayed
                    req.session.successMessageDisplayed = true;       //created here
                }
                else {
                    req.session.deletedMessageDisplayed = false;
                    deletedMessageDisplayed = false;
                }

            res.render("product_management", {productDeleteSuccess: req.session.productDeleted, deletedMessageDisplayed,
                                             updateproductSuccess: req.session.productUpdated,
                                             messageDisplayed, allProductDetails }, (error, data) => { 
                if (error) {
                    console.error('Error rendering product_management template:', error);
                    return res.status(500).send("Internal server error");
                }
                // reset session variables after sending the response
                req.session.deletedMessageDisplayed = false;
                delete req.session.productDeleted;

                req.session.successMessageDisplayed = false;
                delete req.session.productUpdated;
                res.send(data);
            });
          } catch (error) {
            console.error('Error fetching products from MongoDB:', error);
            res.status(500).send('Internal Server Error');
          }
    },
};




//adminUnlisted-product - GET
const getAdminUnlistedProduct = {
    async unlistedProduct (req, res) {
    try {
        const allProductDetails = await productDB.find(); // Fetch all products from MongoDB

        //product recovered success message
            // let productRecoverSuccess = req.session.productRecovered;
            let messageDisplayed = req.session.successMessageDisplayed;
                if (req.session.productRecovered && !messageDisplayed) {                       // Set a session variable to track that the message has been displayed
                    req.session.successMessageDisplayed = true;       //created here
                }
                else {
                    req.session.successMessageDisplayed = false;
                    messageDisplayed = false;
                }

            res.render("unlisted_product",{productRecoverSuccess: req.session.productRecovered, messageDisplayed, allProductDetails }, (error, data) => { 
                if (error) {
                    console.error('Error rendering product_management template:', error);
                    return res.status(500).send("Internal server error");
                }
                // reset session variables after sending the response
                req.session.successMessageDisplayed = false;
                delete req.session.productRecovered;
                res.send(data);
            });
    }catch (error) {
        console.error('Error fetching products from MongoDB:', error);
        res.status(500).send('Internal Server Error');
      }
    },
};


///update-product - GET  
const getUpdateProduct = {
    async updateProduct(req, res) {
        try {
            const productId = req.query.productId;      //this is from route query in pro_mng.ejs
            const updateProductDetails = await productDB.findOne({ _id: productId });    //already existing details
            console.log('this is the details before updating,sending to display in update page:',updateProductDetails);
            
            const allCategories = await categoryDB.find(); // Fetch all categories from MongoDB

            

            res.render("update_product", {updateProductDetails, allCategories },(error, data) => {
            if (error) {
                console.error('error rendering update_product template:', error);
                return res.status(500).send("Internal server error");
            }
            res.send(data);
        });
        } catch (error) {
            console.error('Error fetching product details:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};



///category-management - GET
const getCategoryManagement = {
    async categoryManagement(req, res) {
        try {
            const allCategories = await categoryDB.find(); // Fetch all products from MongoDB
            // console.log(allCategories);

            // category deleted message
            // let categoryDeleteSuccess = req.session.categoryDeleted;
            let messageDisplayed = req.session.successMessageDisplayed;
                if (req.session.categoryDeleted && !messageDisplayed) {                       // Set a session variable to track that the message has been displayed
                    req.session.successMessageDisplayed = true;       //created here
                }
                else {
                    req.session.successMessageDisplayed = false;
                    messageDisplayed = false;
                }

            res.render("category_management", {categoryDeleteSuccess: req.session.categoryDeleted,messageDisplayed, allCategories },  (error, data) => { 
                if (error) {
                    console.error('Error rendering product_management template:', error);
                    return res.status(500).send("Internal server error");
                }
                // reset session variables after sending the response
                req.session.successMessageDisplayed = false;
                delete req.session.categoryDeleted;
                res.send(data);
            }); 
        } catch (error) {
            console.error('Error fetching products from MongoDB:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};
 



///unlisted-category - GET 
const getUnlistedCategory = {
    async unlistedCategory(req, res) {
        try {
            const allCategories = await categoryDB.find(); // Fetch all products from MongoDB

            // category recovered message
            // let categoryRecoverSuccess = req.session.categoryRecovered;
            let messageDisplayed = req.session.successMessageDisplayed;
                if (req.session.categoryRecovered && !messageDisplayed) {                       // Set a session variable to track that the message has been displayed
                    req.session.successMessageDisplayed = true;       //created here
                }
                else {
                    req.session.successMessageDisplayed = false;
                    messageDisplayed = false;
                }
            
            res.render("unlisted_category",{categoryRecoverSuccess: req.session.categoryRecovered, messageDisplayed, allCategories}, (error, data) => { 
                if (error) {
                    console.error('Error rendering product_management template:', error);
                    return res.status(500).send("Internal server error");
                }
                // reset session variables after sending the response
                req.session.successMessageDisplayed = false;
                delete req.session.categoryRecovered;
                res.send(data);
            }); 
        }catch (error) {
            console.error('Error fetching products from MongoDB:', error);
            res.status(500).send('Internal Server Error');
          }
    },
};




///add-category - GET
const getAddCategory = {
    addCategory(req, res) {

            //new category added success message
            // let categoryAddedSuccess = req.session.categoryAdded;
            let messageDisplayed = req.session.successMessageDisplayed;
                if (req.session.categoryAdded && !messageDisplayed) {                       // Set a session variable to track that the message has been displayed
                    req.session.successMessageDisplayed = true;       //created here
                }
                else {
                    req.session.successMessageDisplayed = false;
                    messageDisplayed = false;
                }

            res.render("add_category",{categoryExistError: req.session.categoryExist,categoryAddedSuccess: req.session.categoryAdded, messageDisplayed}, (error, data) => { 
                if (error) {
                    console.error('Error rendering product_management template:', error);
                    return res.status(500).send("Internal server error");
                }
                // reset session variables after sending the response
                req.session.successMessageDisplayed = false;
                delete req.session.categoryAdded;
                delete req.session.categoryExist
                res.send(data);
            });
    },
};

/************* end of Admin side ****************/




module.exports= {getUserSignup, getOtpPage, getUserLogin,
                     getHome, getForgotPsw, getPswSetup, getAllWatches, getAdminLogin,
                      getAdminHome, getuserManagement, getAdminAddProduct, getProductManagement,
                       getSingleProduct, getAdminUnlistedProduct, getUpdateProduct, 
                       getCategoryManagement, getUnlistedCategory, getAddCategory, getMenswatches,
                       getWomenswatches, getShoppingCart, getWishlist, getUserProfile, 
                       getUserEditProfile, getAddAddress, getUserAddress, getAddressImage}