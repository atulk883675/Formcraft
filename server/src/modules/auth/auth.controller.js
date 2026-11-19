
const {
  registerAdmin,
  loginAdmin,
  refreshAdminSession,
  requestPasswordReset,
  resetAdminPassword,
  logoutAdminSession,
  logoutAllAdminSessions,
} = require("./auth.service");

const ApiResponse = require("../../utils/ApiResponse");
const env = require("../../config/env");

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
};

const clearRefreshTokenCookie = (res) => {
  const { maxAge, ...clearOptions } = refreshCookieOptions;
  res.clearCookie("refreshToken", clearOptions);
};

const register = async (req, res) => {
  const { name, email, password } = req.body;

  const result = await registerAdmin({ name, email, password });

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

const login = async (req, res) => {
  const { email, password } = req.body;

  const result = await loginAdmin({ email, password });

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

const refresh = async (req, res) => {
  const presentedToken = req.cookies?.refreshToken;

  const result = await refreshAdminSession(presentedToken);

  setRefreshTokenCookie(res, result.refreshToken);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        admin: result.admin,
        accessToken: result.accessToken,
      },
      "Session refreshed successfully"
    )
  );
};

// Request a password-reset email.
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  await requestPasswordReset({ email });

  // Same response whether the account exists or not.
  res.status(200).json(
    new ApiResponse(
      200,
      null,
      "If an account exists with that email, password-reset instructions will be sent."
    )
  );
};

// Reset the Admin password.
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  await resetAdminPassword({ token, newPassword });

  res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Password reset successfully. Please log in again."
    )
  );
};

const logout = async (req, res) => {
  await logoutAdminSession(
    req.auth.adminId,
    req.auth.sessionId
  );

  clearRefreshTokenCookie(res);

  res.status(200).json(
    new ApiResponse(200, null, "Logged out successfully")
  );
};

const logoutAll = async (req, res) => {
  await logoutAllAdminSessions(req.auth.adminId);

  clearRefreshTokenCookie(res);

  res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Logged out from all devices successfully"
    )
  );
};

module.exports = {
  register,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  logout,
  logoutAll,
};
