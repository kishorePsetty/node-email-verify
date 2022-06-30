const sendEmail = require("../utils/email");
const Token = require("../models/token");
const { User, validate } = require("../models/user");
const crypto = import("crypto");
const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error) {
      return res.status(400).send({
        success: false,
        message: error.details[0].message,
      });
    }

    let user = await User.findOne({ email: req.body.email });

    if (user) {
      return res.status(400).send({
        success: false,
        message: "User with given email already exist!",
      });
    }

    user = await new User({
      name: req.body.name,
      email: req.body.email,
    }).save();

    const token = await new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    }).save();

    const timestamp = new Date().getTime();
    const message = `${process.env.BASE_URL}/user/verify/${user.id}/${token.token}/${timestamp}`;
    await sendEmail(user.email, "Verify Email", message);

    res.send({
      success: true,
      message: "An Email sent to your account please verify",
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: "An error occured"
    });
  }
});

router.get("/verify/:id/:token/:timestamp", async (req, res) => {
  try {
    const { token: authToken, timestamp, id } = req.params;
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "Invalid link",
      });
    }
    
    const token = await Token.findOne({
      userId: user._id,
      token: authToken,
    });

    if (!token) {
      return res.status(400).send("Invalid link");
    }

    const timeDifference = timestamp - new Date().getTime();
    const timeDifferenceInMinutes = timeDifference/60/1000;
    if (timeDifferenceInMinutes > 10) {
      return res.status(400).send({
        success: false,
        message: "The verification link is expired",
      });
    }
    
    await User.updateOne({ _id: user._id, verified: true });
    await Token.findByIdAndRemove(token._id);

    res.send({
      success: true,
      message: "email verified sucessfully",
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: "An error occured",
    });
  }
});

module.exports = router;