import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import FileController from "./file.controller.ts";
import { upload } from "../../service/multer.ts";

const routes = Router();
const fileController = new FileController();

routes.post(
  "/file",
  upload.single("file"),
  asyncHandler(fileController.fileUploadController.bind(fileController)),
);
export default routes;
