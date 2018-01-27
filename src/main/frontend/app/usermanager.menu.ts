import {Injectable} from "@angular/core";
import {MenuService} from "eds-common-js";
import {MenuOption} from "eds-common-js/dist/layout/models/MenuOption";

@Injectable()
export class UserManagerMenuService implements  MenuService {

	getApplicationTitle(): string {
		return 'User Manager';
	}

	getClientId(): string {
		return 'eds-user-manager';
	}

	getMenuOptions():MenuOption[] {
				return [
					{caption: 'User Manager', state: 'app.userManager', icon: 'fa fa-users', role: 'eds-user-manager:user-manager'},
					{caption: 'Role Manager', state: 'app.roleManager', icon: 'fa fa-tasks', role: 'eds-user-manager:role-manager'},
					{caption: 'Client Manager', state: 'app.clientManager', icon: 'fa fa-laptop', role: 'eds-user-manager:client-manager'},
				];
		}
}