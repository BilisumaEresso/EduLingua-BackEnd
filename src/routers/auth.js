const express=require("express")
const sendSuccess = require("../utils/sendSuccess")
 
const router=express.Router()

router.post("/signup",(req,res,next)=>{
    sendSuccess(res,200,"this is success")
})
router.post("/login", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.get("/me", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.put("/update", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.delete("/delete", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.put("/premium", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.post("/teacher/apply", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.post("/usubscribe", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});



module.exports=router