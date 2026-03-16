const express=require("express")
require("dotenv").config()
const app= express()
const {errorHandler}=require("./src/middleware/errorHandler")
const AppError = require("./src/utils/AppError")


app.get("/",(req,res,next)=>{
    res.send(`Server Running on ${process.env.PORT}` )
})

app.use((req,res,next)=>{
    res.send(new AppError("API not found",404))
})

app.use(errorHandler)
module.exports=app