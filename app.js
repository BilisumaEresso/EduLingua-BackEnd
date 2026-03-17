const express=require("express")
require("dotenv").config()
const app= express()
const {errorHandler}=require("./src/middleware/errorHandler")
const AppError = require("./src/utils/AppError")
const sendSuccess = require("./src/utils/sendSuccess")
const {authRoute, langRoute}=require("./src/routers")

app.use(express.json({ limit: "10kb" }));

// routers
app.use("/api/v1/auth",authRoute)
app.use("/api/v1/lang",langRoute)
app.get("/",(req,res,next)=>{
    sendSuccess(res,200,`Running on port ${process.env.PORT}`)
})

app.use((req,res,next)=>{
    throw new AppError("API not found",404)
})

app.use(errorHandler)
module.exports=app