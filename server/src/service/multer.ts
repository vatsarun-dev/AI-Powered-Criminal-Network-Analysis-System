import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const uploadDirectory = path.join(process.cwd(), "src", "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (_req, file, cb) => {
    cb(null, file.originalname);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowedTypes = ["application/pdf", "text/csv"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only PDF and CSV files are allowed"));
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});
