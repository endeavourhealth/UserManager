import {Injectable} from "@angular/core";
import {MenuService} from "eds-common-js";
import {MenuOption} from "eds-common-js/dist/layout/models/MenuOption";
import {SecurityService} from "eds-common-js";
import {User} from "eds-common-js/dist/security/models/User";

@Injectable()
export class UserManagerMenuService implements  MenuService {
	currentUser:User;

	getApplicationTitle(): string {
		return 'Discovery Authentication Service';
	}

	getClientId(): string {
		return 'eds-user-manager';
	}

	constructor(private securityService:SecurityService) {
		let vm = this;
		vm.currentUser = vm.securityService.getCurrentUser();
	}

	getMenuOptions():MenuOption[] {
				return [
					{caption: 'User Manager', state: 'app.userManager', icon: 'fa fa-users', role: 'eds-user-manager:user-manager'},
					{caption: 'Role Manager', state: 'app.roleManager', icon: 'fa fa-tasks', role: 'eds-user-manager:role-manager'},
					{caption: 'Client Manager', state: 'app.clientManager', icon: 'fa fa-laptop', role: 'eds-user-manager:client-manager'},
					//{caption: 'Management', state: 'app.managerList', icon: 'fa fa-user'},
				];
		}
}