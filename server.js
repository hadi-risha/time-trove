const express=require('express');
const dotenv=require('dotenv');
const axios=require("axios")
const bodyparser=require('body-parser');     //for accepting post form data
const path=require("path");
const mongoose=require("mongoose");
const session=require("express-session")
const connectDB = require("./server/database/connection");
const userdbCollection = require("./server/model/model");
const UserRouter = require('./server/routes/router');
const morgan = require('morgan');
const multer = require("multer");
const cookieParser = require('cookie-parser');


const app=express();





app.use(
    session({
      secret: "time trove",
      resave: false,
      saveUninitialized: true,
    })
  );
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); 
    res.setHeader("Pragma", "no-cache"); 
    res.setHeader("Expires", "0"); 
    next()
})

dotenv.config({path:'config.env'});

// helps to get mongodb data
app.use(express.urlencoded({extended:true}));

app.use(morgan('dev'));

connectDB();

//this middleware for JSON parsing
app.use(express.json());

app.set('view engine','ejs')

//loading public assets
app.use("/css",(express.static(path.join(__dirname,"public/css"))));
app.use("/ejs",(express.static(path.join(__dirname,"public/js"))));
app.use("/img",(express.static(path.join(__dirname,"public/img"))));
app.use("/uploads",(express.static(path.join(__dirname,"uploads"))));





app.use('/', UserRouter);        // Or app.use('/',require('./server/routes/router'))





const PORT=process.env.PORT || 9001;
app.listen(PORT,(req,res)=>{console.log(`server running on http://localhost:${PORT}`)});