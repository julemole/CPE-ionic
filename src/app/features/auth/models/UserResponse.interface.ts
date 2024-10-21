export interface UserResponse {
  token: string;
  csrf_token: string;
  current_user: Account;
  logout_token: string;
}

export interface Account {
  uid: number;
  uuid: string,
  roles: string[];
  name: string;
  mail: string,
  field_apellidos: string,
  field_documento: string,
  field_nombres: string,
  field_telefono: string,
  field_tipo_de_documento: string;
}
