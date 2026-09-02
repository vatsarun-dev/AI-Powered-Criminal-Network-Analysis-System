import UserModel, { type UserDocument } from "../models/user.model.js";

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
};

export default class UserRepo {
  async createUser(input: CreateUserInput): Promise<UserDocument> {
    return UserModel.create(input);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email }).select("+password +refreshToken");
  }

  async findById(id: string): Promise<UserDocument | null> {
    return UserModel.findById(id);
  }

  async saveRefreshToken(id: string, refreshToken: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { refreshToken });
  }

  async clearRefreshToken(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { $unset: { refreshToken: "" } });
  }

  async findByRefreshToken(refreshToken: string): Promise<UserDocument | null> {
    return UserModel.findOne({ refreshToken }).select("+refreshToken");
  }
}
