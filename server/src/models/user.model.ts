import { model, Schema } from "mongoose";
import { comparePassword, hashPassword } from "../utils/password.js";
import type { User }from "../types/user.ts";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await hashPassword(this.password);
});

userSchema.methods.comparePassword = function (password: string) {
  return comparePassword(password, this.password);
};

const UserModel = model<User>("User", userSchema);

export default UserModel;