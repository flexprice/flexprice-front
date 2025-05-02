export interface SignupData {
	email: string;
	password?: string;
	token?: string;
}

export interface LoginData {
	email: string;
	password: string;
}

export interface LocalUser {
	token: string;
	user_id: string;
	tenant_id: string;
}
