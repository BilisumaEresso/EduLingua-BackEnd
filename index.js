const {connectDb}=require("./src/config/mongoDb")
const app=require("./app")
const { hash } = require("bcrypt")
require("dotenv")
const port=process.env.PORT
connectDb()


app.listen(port,()=>{
    console.log(`Server running on port ${port}`)
})

