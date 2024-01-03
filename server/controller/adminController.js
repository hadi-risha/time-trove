const express = require("express");
const mongoose = require('mongoose');
const userdbCollection = require("../model/model");
const productDB =require("../model/productModel")
const categoryDB = require("../model/categoryModel")
const multer = require("multer");
const fs = require('fs');



//admin - POST    (login) 
const adminLoginPost = {
    adminlogin(req, res) {
        const password = "1234";
        const userName = "hadi";
        
        const inputPassword = req.body.pass;
        const inputUserName = req.body.name;
        
        if (password === inputPassword && userName === inputUserName) {
            req.session.isAuth = true;
            res.redirect("/adminHome");               
        
        } else {
            req.session.invalidCredentials = true;
            res.redirect("/admin");            //admin login page
        }
    },
};


//ad-logout - POST
const adminLogout = {
    adminsignout(req, res) {
        req.session.destroy();
        res.redirect("/admin");
    },
};


//user-management - POST
const userManagement = {          // no need
    uManagement:async (req, res) =>{
        const email = req.body.email;
        try{
         const userDetails = await userdbCollection.find();
         res.render('user_management', { userDetails });
        //  console.log('User Details:', userDetails);
        
        
        } catch(err) {
         console.log('register err', err);
         // res.send('Internal server err');
        }
        
        //find by id---block and unblock section
        const userId = req.params.userId;

        try {
            const user = await userdbCollection.findOne({_id: userId});
                if (!user) {
                    console.log('User not found');
                    return res.status(404).json({ message: 'User not found' });
                }

            //here
            // user.isBlocked = !user.isBlocked;
            if(user.isBlocked === false){
                await userdbCollection.updateOne({ _id: userId },{ $set: { isBlocked: true } });
            }else{
                await userdbCollection.updateOne({ _id: userId },{ $set: { isBlocked: false } });
            }
            // Save the updated user to the database
            // user.save();
            res.redirect('/user-management'); // Redirect to the user management page
        }catch (err) {
            console.log('Block/Unblock error:', err);
            res.status(500).json({ message: 'Internal Server Error' });
        }
        
    },
};




//user-management and  Block and unblock - POST       (imp)
const blockUnblockUser = {
    userManage: async (req, res) => {
        const userId = req.params.userId;

        try {
            const user = await userdbCollection.findOne({_id: userId});
                if (!user) {
                    console.log('User not found');
                    return res.status(404).json({ message: 'User not found' });
                }

            
            //checking user to block
            if(user.isBlocked == false){
                await userdbCollection.updateOne({ _id: userId },{ $set: { isBlocked: true } });
                req.session.userBlocked= true;          //means user blocked
            }else{
                await userdbCollection.updateOne({ _id: userId },{ $set: { isBlocked: false } });
                req.session.userBlocked= false;
            }
            // Save the updated user to the database
            user.save();
            res.redirect('/user-management'); // Redirect to the user management page
        }catch (err) {
            console.log('Block/Unblock error:', err);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
};



//add-product - POST
const addproduct = {
    async addProd(req, res, next) {
        const files = req.files           //with this we can access all the images

        if(!files){
            const error = new Error ('Please choose files');
            error.httpStatusCode = 400;
            return next(error)
        }
   
        
        let imgArray = files.map((file)=>{  return `/uploads/${file.filename}`});
        
        
        //create new product(in mongodb db)
        
            //create object to store data in the mongodb collection
            let newProduct = new productDB({
                productName: req.body.pName,
                category: req.body.category,
                productDescription: req.body.pDescription,
                firstPrice: req.body.fPrice,
                lastPrice: req.body.lPrice,
                discount:req.body.discount,
                quantity:req.body.quantity,
                images:imgArray,  
            })
            console.log(newProduct);
            //save new product
             const result = await newProduct.save();

             if(result){
                req.session.productAdded = true
                res.redirect('/add-product');
             }
    },
};


//update-product - POST
const updateProduct = {
    async updateProd(req, res) {
        const productId = req.body.id;

        console.log('new details before the updation',req.body);
        // const newDetails ={productName:req.body.pName,   //its not working
        //                 category:req.body.category,
        //                 productDescription:req.body.pDescription,
        //                 firstPrice: req.body.fPrice,
        //                 lastPrice: req.body.lPrice,
        //                 discount: req.body.discount,
        //                 quantity: req.body.quantity,
        //                 images:   req.body.images
        //                 } 

        console.log('product id: ',req.body.id);
        try {
            const updatedProduct = await productDB.findByIdAndUpdate({_id:productId}, { $set: {productName:req.body.pName,
                                                    category:req.body.category,
                                                    productDescription:req.body.pDescription,
                                                    firstPrice: req.body.fPrice,
                                                    lastPrice: req.body.lPrice,
                                                    discount: req.body.discount,
                                                    quantity: req.body.quantity,
                                                    images:   req.body.images} }, { new: true, useFindAndModify: false });

            if (updatedProduct) {
               console.log('new details after updation',updatedProduct);
              console.log("Updated successfully");
              req.session.productUpdated = true
              res.redirect('/adminProductManagement');
            } else {
              console.log("Product not found or not updated");
            }
          } catch (error) {
            console.error('Error updating product:', error);
            // Handle the error appropriately
          }   
    },
};


///update-deleteImage - POST
// const deleteImage = {
//     async deleteImg(req, res) {
//         const id=req.body.id;
//         const imageUrlToDelete = req.body.imageUrl;
//         console.log(req.body.imageUrl);
//         console.log(id);

//         await productDB.updateOne({_id:id},{ $pull: { images: imageUrlToDelete } });
//         res.redirect("/update-product");
//         console.log('image deleted succefully');
//     },
// };


//delete-product - POST
const deleteProduct = {
    async deleteProd(req, res) {
        const id=req.body.id;
        console.log(id);

        await productDB.updateOne({_id:id},{$set:{unlisted:true}});
        req.session.productDeleted = true;
        res.redirect("/adminProductManagement");
        console.log('product moved to unlisted');
    },
};


//recover-product - POST
const recoverProduct = {
    async recoverProd(req, res) {
        const id=req.body.id;
        console.log(id);

        await productDB.updateOne({_id:id},{$set:{unlisted:false}});
        req.session.productRecovered = true;
        res.redirect("/adminUnlisted-product");
        console.log('product recovered from unlisted');
    },
};


//add-category - POST
const addCategory = {
    async addCat(req, res) {
        try{
            //checking if category already exist
            const result = await categoryDB.findOne({ category: req.body.category });
        
            if (result) {
            //A category already exists
            req.session.categoryExist = true;
            res.redirect("/add-category");
            return;
            }


            const newCategory = new categoryDB({
                category: req.body.category
            });

            const category = await newCategory.save();
            if(category){
                console.log('successfully created new category');
                req.session.categoryAdded = true;
                res.redirect('/add-category');
            }

        }catch(err){
            console.log('register err', err);
            res.send('Internal server err');
        }

    },
};

//delete-category - POST
const deleteCategory = {
    async removeCat(req, res) {
        
        const id=req.body.id;
        console.log(id);

        await categoryDB.updateOne({_id:id},{$set:{unlisted:true}});
        req.session.categoryDeleted = true;
        res.redirect("/category-management");
        console.log('category moved to unlisted');

    },
};


//recover-category - POST
const recoverCategory = {
    async recoverCat(req, res) {
        const id=req.body.id;
        console.log(id);

        await categoryDB.updateOne({_id:id},{$set:{unlisted:false}});
        req.session.categoryRecovered = true;
        res.redirect("/unlisted-category");
        console.log('category recovered from unlisted');
    },
};








module.exports = { adminLoginPost, adminLogout, addproduct,  userManagement,
     blockUnblockUser, deleteProduct, recoverProduct, updateProduct, addCategory, deleteCategory, recoverCategory};