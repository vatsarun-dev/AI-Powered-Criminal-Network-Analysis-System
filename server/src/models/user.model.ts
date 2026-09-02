import { model, Schema, type HydratedDocument } from "mongoose";
import { comparePassword, hashPassword } from "../utils/password.js";
import User from "../types/user.ts";

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
  this.password = bcrypt.hashSync(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function () {
  return bcrypt.compareSync(password, this.password);
};

const UserModel = model<User, typeof UserModel>("User", userSchema);

export default UserModel;
