import {UserRole} from "./UserRole";
export class Client {

			constructor() {
	}

	uuid: string;
	name: string;
	clientId: string;
	description: string;
	clientRoles: UserRole[];
}
