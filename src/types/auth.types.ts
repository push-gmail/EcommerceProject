export interface MasterUser {
  id: string;
  name: string;
  email: string;
}

export interface MasterLoginResponse {
  success: boolean;
  message: string;
  data: MasterUser;
}