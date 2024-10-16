export interface AuthRequest {
  name: string;
  pass: string;
}

export interface AuthResponse {
  current_user: CurrentUser;
  csrf_token:   string;
  logout_token: string;
}

export interface CurrentUser {
  uid:   string;
  roles: string[];
  name:  string;
}
