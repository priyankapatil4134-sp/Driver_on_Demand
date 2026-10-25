
const express = require("express");
const { body, validationResult } = require("express-validator");
const { register, login } = require("../controllers/authController");

const router = express.Router();

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg
      }))
    });
  }

  next();
};

const registerValidation = [
  body("role")
    .isIn(["Customer", "Driver"])
    .withMessage("Role must be Customer or Driver"),

  body("full_name")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),

  body("phone")
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Enter a valid phone number"),

  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  body("email").custom((value, { req }) => {
    if (req.body.role === "Customer" && !value) {
      throw new Error("Email is required for Customer");
    }
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new Error("Enter a valid email address");
    }
    return true;
  }),

  body("address").custom((value, { req }) => {
    if (req.body.role === "Customer" && !value) {
      throw new Error("Address is required for Customer");
    }
    return true;
  }),

  body("license_number").custom((value, { req }) => {
    if (req.body.role === "Driver" && !value) {
      throw new Error("License number is required for Driver");
    }
    return true;
  })
];

const loginValidation = [
  body("role")
    .isIn(["Customer", "Driver", "Admin"])
    .withMessage("Select a valid role"),

  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Email or phone is required"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
];

router.post(
  "/register",
  registerValidation,
  checkValidation,
  register
);

router.post(
  "/login",
  loginValidation,
  checkValidation,
  login
);

module.exports = router;
