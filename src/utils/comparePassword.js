const bcrypt=require("bcrypt")

const comparePassword=(newPassword,hashedPassword)=>{
    return bcrypt.compare(newPassword,hashedPassword)
}

module.exports=comparePassword