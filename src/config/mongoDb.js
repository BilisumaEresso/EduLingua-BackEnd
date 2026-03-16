const mongoose= require("mongoose")
require("dotenv").config()

const con_url=process.env.CONNECTION_STRING

const connectDb= async()=>{
    try{
       await mongoose.connect(con_url).then(()=>console.log("Database connected successfully !!"))
    }catch(err){
        console.error("Error on db connection :"+err)
    }
}

module.exports={connectDb}