// create token and saving that in cookies
const sendToken = (user, statusCode, res) => {
  const token = user.getJwtToken();

  // Options for cookies
  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "none",
    secure: true,
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
  });
};

const sendTokenUser = (user, statusCode, res) => {

  // Options for cookies
  const token = user.getJwtToken(); // Assuming user model has a method to generate JWT token

  res.status(statusCode).json({
    success: true,
    message, // ✅ Include success message
    token,
    user,
  });
};

module.exports = sendToken, sendTokenUser;
