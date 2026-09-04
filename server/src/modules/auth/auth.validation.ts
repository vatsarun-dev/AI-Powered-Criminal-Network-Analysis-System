import validRequest from "../../utils/validRequest.js";
import { body } from "express-validator";
export const registerValidationRule = [
  body("name")
    .trim()
    .not()
    .isIn(["admin", "root", "superuser"])
    .notEmpty()
    .withMessage("Name must be required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be 2-50 character"),
  body("email")
    .trim()
    .not()
    .contains("+")
    .notEmpty()
    .withMessage("Email is required")
    .normalizeEmail()
    .isEmail()
    .withMessage("Enter a valid Email"),

  body("designation").trim().optional(),

  body("password")
    .notEmpty()
    .withMessage("password required")
    .isLength({ min: 6, max: 10 })
    .withMessage("password must contain 6-10 words")
    .matches(/\d/)
    .withMessage("Must contain at least one digit")
    .matches(/[!@#$%]/)
    .withMessage("Must contain a special character"),
  validRequest,
];
export const loginValidationRule = [
  body("email")
    .trim()
    .not()
    .contains("+")
    .notEmpty()
    .withMessage("Email is required")
    .normalizeEmail()
    .isEmail()
    .withMessage("Enter a valid Email"),
  body("password")
    .notEmpty()
    .withMessage("password required")
    .isLength({ min: 6, max: 10 })
    .withMessage("password must contain 6-10 words")
    .matches(/\d/)
    .withMessage("Must contain at least one digit")
    .matches(/[!@#$%]/)
    .withMessage("Must contain a special character"),
  validRequest,
];
