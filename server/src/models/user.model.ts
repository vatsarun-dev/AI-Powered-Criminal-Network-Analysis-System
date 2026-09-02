import { model, Schema, type HydratedDocument } from "mongoose";
import { comparePassword, hashPassword } from "../utils/password.js";

export type User = {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  refreshToken?: string;
};

export type UserMethods = {
  comparePassword(password: string): Promise<boolean>;
};

export type UserDocument = HydratedDocument<User, UserMethods>;

const userSchema = new Schema<User, typeof UserModel, UserMethods>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    refreshToken: {
      type: String,
      select: false
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashUserPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await hashPassword(this.password);
  next();
});

userSchema.method("comparePassword", function compareUserPassword(password: string) {
  return comparePassword(password, this.password);
});

const UserModel = model<User, typeof UserModel>("User", userSchema);

export default UserModel;
