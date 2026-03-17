const express=require("express")
const sendSuccess = require("../utils/sendSuccess")

const router=express.Router()


// teachers router
router.post("/add",(req,res,next)=>{
    sendSuccess(res,200,"this is success")
})
router.put("/update", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.delete("/delete", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.get("/my-lessons", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.get("/my-lessons/:id", (req, res, next) => {  //id = lesson id
  sendSuccess(res, 200, "this is success");
});
router.post("/section/add", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.put("/section/update", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.get("/:id/sectiont", (req, res, next) => { //id = lessons id this used for getting all sections under a lesson
  sendSuccess(res, 200, "this is success");
});
router.get("/section/:id", (req, res, next) => { //id = section id this used for getting a section
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