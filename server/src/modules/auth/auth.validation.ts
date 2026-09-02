import { body } from "express-validator";
import validateRequest from "../../middlewares/validate.middleware.js";

export const registerValidationRule = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be 2-50 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .normalizeEmail()
    .isEmail()
    .withMessage("Enter a valid email"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 72 })
    .withMessage("Password must be 8-72 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one digit")
    .matches(/[!@#$%^&*]/)
    .withMessage("Password must contain a special character"),
  validateRequest
];

export const loginValidationRule = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .normalizeEmail()
    .isEmail()
    .withMessage("Enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  validateRequest
];
