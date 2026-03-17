const express=require("express")
const sendSuccess = require("../utils/sendSuccess")

const router=express.Router()

router.post("/add",(req,res,next)=>{
    sendSuccess(res,200,"this is success")
})
router.get("/:code", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.get("/", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.put("/update", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.delete("/delete", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});



module.exports=router