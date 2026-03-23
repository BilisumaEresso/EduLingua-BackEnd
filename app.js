const express=require("express")
require("dotenv").config()
const app= express()
const {errorHandler}=require("./src/middleware/errorHandler")
const AppError = require("./src/utils/AppError")
const sendSuccess = require("./src/utils/sendSuccess")
const {authRoute, langRoute, lessonRoute, chatRoute, adminRoute, userProgressRoute, learningRoute, levelRoute, sectionRoute, quizRoute, aiRoute}=require("./src/routers")

app.use(express.json({ limit: "10kb" }));

// routers
app.use("/api/v1/auth",authRoute)
app.use("/api/v1/lang",langRoute)
app.use("/api/v1/lesson",lessonRoute)
app.use("/api/v1/chat",chatRoute)
app.use("/api/v1/admin",adminRoute)
app.use("/api/v1/progress",userProgressRoute)
app.use("/api/v1/learning",learningRoute)
app.use("/api/v1/level",levelRoute)
app.use("/api/v1/section",sectionRoute)
app.use("/api/v1/quiz",quizRoute)
app.use("/api/v1/ai",aiRoute)



app.get("/",(req,res,next)=>{
    sendSuccess(res,200,`Running on port ${process.env.PORT}`)
})

app.use((req,res,next)=>{
    throw new AppError("API not found",404)
})

app.use(errorHandler)
module.exports=app