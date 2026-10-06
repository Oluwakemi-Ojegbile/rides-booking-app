const { body, validationResult } = require("express-validator");
const { sendError } = require("../services/apiResponse");

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return sendError(res, errors.array()[0].msg, 400);
}

const registerRules = [
  body("fullName").custom((value, { req }) => {
    if (!(value || req.body.name)?.trim()) throw new Error("Full name is required");
    return true;
  }),
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("phone").trim().matches(/^\+?[0-9][0-9\s-]{6,19}$/).withMessage("A valid phone number is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("role").isIn(["rider", "driver"]).withMessage("Role must be rider or driver"),
  body("vehicleMake")
    .if(body("role").equals("driver"))
    .trim()
    .notEmpty()
    .withMessage("Vehicle make is required for drivers"),
  body("vehicleModel")
    .if(body("role").equals("driver"))
    .trim()
    .notEmpty()
    .withMessage("Vehicle model is required for drivers"),
  body("vehicleColor")
    .if(body("role").equals("driver"))
    .trim()
    .notEmpty()
    .withMessage("Vehicle colour is required for drivers"),
  body("plateNumber")
    .if(body("role").equals("driver"))
    .trim()
    .notEmpty()
    .withMessage("Plate number is required for drivers"),
  handleValidation,
];

const loginRules = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidation,
];

const createAdminInvitationRules = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  handleValidation,
];

const acceptAdminInvitationRules = [
  body("token").isString().notEmpty().withMessage("A valid invitation token is required"),
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("phone").trim().matches(/^\+?[0-9][0-9\s-]{6,19}$/).withMessage("A valid phone number is required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
  handleValidation,
];

module.exports = { registerRules, loginRules, createAdminInvitationRules, acceptAdminInvitationRules };
