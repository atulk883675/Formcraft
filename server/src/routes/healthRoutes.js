const express = require("express");
const { z } = require("zod");


const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FormCraft API is running!",
  });
});


module.exports = router;