
const {
  registerAdmin,
  loginAdmin,
} = require("./auth.service");

const ApiResponse = require("../../utils/ApiResponse");
const env = require("../../config/env");

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// Admin registration
const register = async (req, res) => {
  const { name, email, password } = req.body;

  const result = await registerAdmin({
    name,
    email,
    password,
  });

  setRefreshTokenCookie(res, result.refreshToken);

  res.status(201).json(
    new ApiResponse(
      201,
      {
        admin: result.admin,
        accessToken: result.accessToken,
      },
      "Admin registered successfully"
    )
  );
};

// Admin login
const login = async (req, res) => {
  const { email, password } = req.body;

  const result = await loginAdmin({
    email,
    password,
  });

  setRefreshTokenCookie(res, result.refreshToken);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        admin: result.admin,
        accessToken: result.accessToken,
      },
      "Login successful"
    )
  );
};

module.exports = {
  register,
  login,
};
