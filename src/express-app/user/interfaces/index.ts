export interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export  interface IActivationToken {
  token: string;
  activationCode: string;
}

export  interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export  interface ILoginRequest {
  email: string;
  password: string;
}

export interface IUpdateUserInfo {
  name?: string;
  email?: string;
}

export interface IUpdatePassword {
  oldPassword: string;
  newPassword: string;
}

export interface IUpdateProfilePicture {
  avatar: string;
}