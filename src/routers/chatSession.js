const express=require("express")

const router=express.Router()

router.get("/my-chat", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.post("/send", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.put("/update/:id", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.delete("/delete/:id", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});

module.exports=router