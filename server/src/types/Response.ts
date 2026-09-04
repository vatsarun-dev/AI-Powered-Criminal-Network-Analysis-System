export type RegisterUserRequest = {
  name: string;
  email: string;
  password: string;
};

export type LoginUserRequest = {
  email: string;
  password: string;
};

export type AuthResponseUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

export type FileResponse = {
  fileId: string;
  originalName: string;
  type: string;
  size: string;
  status: string;
};
