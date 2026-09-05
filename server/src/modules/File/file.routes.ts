import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import FileController from "./file.controller.js";
import { upload } from "../../service/multer.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/authorize.middleware.js";

const routes = Router();
const fileController = new FileController();

routes.post(
  "/file",
  authMiddleware,
  authorizeRoles("admin"),
  upload.single("file"),
  asyncHandler(fileController.fileUploadController.bind(fileController)),
);
export default routes;
