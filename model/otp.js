const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema({
  mobile: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, expires: 300, default: Date.now }, // OTP expires in 5 minutes
});

module.exports = mongoose.model("OTP", OTPSchema);
