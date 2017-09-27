import {NgbModal, NgbTabChangeEvent} from "@ng-bootstrap/ng-bootstrap";
import {Component, ViewChild} from "@angular/core";
import {UserService} from "./user.service";
import {UserRole} from "./models/UserRole";
import {RoleEditorDialog} from "./roleEditor.dialog";
import {LoggerService, MessageBoxDialog, SecurityService} from "eds-common-js";
import {OrgRole} from "eds-common-js/dist/layout/models/OrgRole";

@Component({
	template : require('./roleManager.html')
})
export class RoleManagerComponent {
	roleList : UserRole[];
	filteredRoleList : UserRole[];
	selectedRole : UserRole;
	searchTerm : string;
	searched : boolean;
	selectedOrganisation : OrgRole;
	userOrganisations : OrgRole[];

	@ViewChild('organisation') organisationSelect;

	constructor(private log:LoggerService,
							private userService : UserService,
							private securityService : SecurityService,
							private $modal : NgbModal) {
		this.searched = false;
		this.getLoggedOnUsersOrganisations();
		this.getRealmRolesByOrg();
	}

	ngAfterViewInit() {
		this.organisationSelect.nativeElement.focus();
	}

	editRole(role:UserRole) {
		var vm = this;
		RoleEditorDialog.open(vm.$modal, role, true, vm.roleList)
			.result.then(
			(editedRole) => vm.saveRole(role, editedRole),
			() => vm.log.info('Role edit cancelled')
		);
	}

	addRole() {
		var vm = this;
		RoleEditorDialog.open(vm.$modal, null, false, vm.roleList)
            .result.then(
			(editedRole) => vm.saveRole(null, editedRole),
			() => vm.log.info('Role add cancelled')
		);
	}

	private saveRole(role, editedRole : UserRole) {
		var vm = this;
		var editMode = (role != null);
		vm.userService.saveRole(editedRole, editMode)
			.subscribe(
				(response) => {
					if (editMode){
						vm.selectedRole = response;
						vm.updateRole(response)
					}
					else {
						vm.getRealmRolesByOrg();
					}

					var msg = (!editMode) ? 'Add role' : 'Edit role';
					vm.log.success('Role saved', response, msg);
				},
				(error) => vm.log.error('Error saving role', error, 'Error')
			);
	}

	deleteRole(role:UserRole) {
		var vm = this;
		var roleName = role.name;
		var roleId = role.uuid;
		MessageBoxDialog.open(vm.$modal, "Confirmation", "Delete role: " + roleName.trim() + "?", "Yes", "No")
                .result.then(
				(result) => {
					vm.userService.deleteRole(roleId)
                        .subscribe(
							(result) => {
								result;
								this.getRealmRolesByOrg();
								this.selectedRole = null;
								vm.log.info("Role deleted");
							},
							(error) => vm.log.error('Error deleting role', error, 'Error')
						);
				},
				(reason) => {
				}
			);
	}

	getRoleList() {
		return this.filteredRoleList;
	}

	selectTopRole(){
		let vm = this;
		if (vm.filteredRoleList != null && vm.filteredRoleList.length > 0)
		{
			let topRoleInList = vm.filteredRoleList[0];
			vm.setSelectedRole (topRoleInList);
		}
		else {
			vm.setSelectedRole (null);
		}
	}

	getRealmRoles(){
		var vm = this;
		vm.roleList = null;
		vm.userService.getRealmRoles()
            .subscribe(
				(result) => {
					vm.roleList = result; vm.filteredRoleList = result;
					vm.selectTopRole();
				},
				(error) => vm.log.error('Error loading realm roles', error, 'Error')
			);
	}

	//gets all roles specific to the organisation
	getRealmRolesByOrg(){
		let vm = this;
		vm.roleList = null;
		vm.clearSearch();
		let orgId = vm.selectedOrganisation.id;
		if (orgId == '-1')
		{
			this.getRealmRoles();
		}
		else {
			vm.userService.getRealmRolesByOrg(orgId)
                .subscribe(
					(result) => {
						vm.roleList = result; vm.filteredRoleList = result;
						vm.selectTopRole();
					},
					(error) => vm.log.error('Error loading users and roles (by OrgId = ' + orgId + ')', error, 'Error')
				);
		}
	}

	setSelectedRole(role) {
		this.selectedRole = role;
	}

	searchRoles(){
		let vm = this;
		let searchTerm = this.searchTerm.trim().toLowerCase();

		if (searchTerm.length > 2)
		{
			vm.filteredRoleList = vm.roleList.filter((role) =>
			role.name.toLowerCase().includes(searchTerm) ||
			role.group.name.toLowerCase().includes(searchTerm));
			vm.searched = true;
			vm.selectTopRole();
		}
		else
		{
			//reset users list back to original
			vm.filteredRoleList = vm.roleList;
			vm.searched = false;
			vm.selectTopRole();
		}
	}

	clearSearch(){
		let vm = this;
		vm.searched = false;
		vm.searchTerm = "";
		vm.filteredRoleList = vm.roleList;
	}

	getLoggedOnUsersOrganisations(){
		let vm = this;
		vm.userOrganisations = [];

		if (vm.securityService.getCurrentUser().isSuperUser == true)
		{
			vm.userOrganisations.push(new OrgRole('-1', '/*.*'));
		}

		for(let orgGroup of vm.securityService.getCurrentUser().organisationGroups) {
			vm.userOrganisations.push(orgGroup);
		}

		//TODO: DEFAULT ORG FROM LOGGED IN ROLE - set into picker and filter
		if (vm.userOrganisations != null) {
			vm.selectedOrganisation = vm.userOrganisations[0];
		}
	}

	setOrganisation(org: OrgRole){
		let vm = this;
		vm.selectedOrganisation = org;
		vm.getRealmRolesByOrg();
	}

	updateRole(editedRole: UserRole){
		let vm = this;
		var index1 = 0;
		for(let role of vm.roleList){
			if (role.uuid == editedRole.uuid){
				vm.roleList[index1] = editedRole;
				if (vm.searched){
					var index2 = 0;
					for(let filteredRole of vm.filteredRoleList){
						if (filteredRole.uuid == editedRole.uuid) {
							vm.filteredRoleList[index2] = editedRole;
							return;
						}
						index2++;
					}
				}
				return;
			}
			index1++;
		}
	}

    hasPermission(role : string) : boolean {
        return this.securityService.hasPermission('eds-user-manager', role);
    }
}

