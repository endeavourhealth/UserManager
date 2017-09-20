import {User} from "./models/User";
import {UserEditorDialog} from "./userEditor.dialog";
import {NgbModal, NgbTabChangeEvent} from "@ng-bootstrap/ng-bootstrap";
import {Component, ViewChild} from "@angular/core";
import {UserService} from "./user.service";
import {UserRole} from "./models/UserRole";
import {SecurityService, MessageBoxDialog, LoggerService} from "eds-common-js";
import {Group} from "./models/Group";
import {OrgRole} from "eds-common-js/dist/layout/models/OrgRole";
import {User as User2} from "eds-common-js/dist/security/models/User";

@Component({
	template : require('./userManager.html')
})
export class UserManagerComponent {
	userList : User[];
	filteredUserList : User[];
	searchTerm : string;
	selectedUser : User = null;
	searched : Boolean;
	selectedRole : UserRole;
	activeTabId : string;
	userRoleList : UserRole[];
	loggedOnUserUuid : string;
	selectedOrganisation : OrgRole;
	userOrganisations : OrgRole[];
	currentUser: User2;

	@ViewChild('organisation') organisationSelect;

	constructor(public log:LoggerService,
							private userService : UserService,
							private securityService : SecurityService,
							private $modal : NgbModal) {
		this.searched = false;

		this.currentUser = this.securityService.getCurrentUser();
		//this.getUsers();
		this.getLoggedOnUsersOrganisations();
		this.getUsersByOrg();
	}

	ngAfterViewInit() {
		this.organisationSelect.nativeElement.focus();
	}

	editUser(user:User) {
		let vm = this;
		UserEditorDialog.open(vm.$modal, user, true, this.userOrganisations)
			.result.then(
			(editedUser) => vm.saveUser(user, editedUser),
			() => vm.log.info('User edit cancelled')
		);
	}

	addUser() {
		let vm = this;
		UserEditorDialog.open(vm.$modal, null, false, this.userOrganisations)
            .result.then(
			(editedUser) => vm.saveUser(null, editedUser),
			() => vm.log.info('User add cancelled')
		);
	}

	createGroup() {
		let vm = this;
		vm.userService.createGroup()
            .subscribe(
				(response) => {
					vm.log.success('Group created', response, 'Success');
				},
				(error) => vm.log.error('Error creating group', error, 'Error')
			);
	}

	private saveUser(user, editedUser : User) {
		let vm = this;
		let editMode = (user != null);

		vm.userService.saveUser(editedUser, editMode)
			.subscribe(
				(response) => {
					if (editMode) {
						vm.selectedUser = response;
						vm.updateUser(response);
						vm.getUserRoles(response);
					}
					else {
						vm.getUsersByOrg();
					}

					let msg = (!editMode) ? 'Add user' : 'Edit user';
					vm.log.success('User saved', response, msg);
				},
				(error) => vm.log.error('Error saving user', error, 'Error')
			);
	}

	deleteUser(user:User) {
		let vm = this;
		let loggedOnUserUuid = this.securityService.getCurrentUser().uuid;
		if (user.uuid == loggedOnUserUuid)
		{
			vm.log.warning("You cannot delete yourself!");
		}
		else {
			let userName = user.forename + " " + user.surname;

			MessageBoxDialog.open(vm.$modal, "Confirmation", "Delete user: " + userName.trim() + "?", "Yes", "No")
                .result.then(
				(result) => {
					let userId = user.uuid;
					vm.userService.deleteUser(userId)
                        .subscribe(
							(result) => {
								result;
								vm.selectedUser = null;
								vm.getUsersByOrg();
								vm.log.info("User deleted");
							},
							(error) => vm.log.error('Error deleting user', error, 'Error')
						);
				},
				(reason) => {
				}
			);
		}
	}

	getUserList() {
		// Perform ordering here?
		return this.filteredUserList;
	}

	selectTopUser(){
		let vm = this;
		if (vm.filteredUserList != null && vm.filteredUserList.length > 0)
		{
			let topUserInList = vm.filteredUserList[0];
			vm.selectedUser = topUserInList;
			vm.getUserRoles(topUserInList);
		}
		else {
			vm.selectedUser = null;
		}
	}

	getUserRoleList() {
		let vm = this;
		vm.selectedUser.userRoles = this.userRoleList;
		return vm.userRoleList;
	}

	//gets all users in the realm
	getUsers(){
		let vm = this;
		vm.userList = null;
		vm.userService.getUsers()
			.subscribe(
				(result) => {
					vm.userList = result; vm.filteredUserList = result;
					vm.selectTopUser();
				},
						(error) => vm.log.error('Error loading users and roles', error, 'Error')
				);
	}

	//gets all users specific to the organisation
	getUsersByOrg(){
		let vm = this;
		vm.userList = null;
		vm.clearSearch();
		let orgId = vm.selectedOrganisation.id;
		if (orgId == '-1')
		{
			this.getUsers();
		}
		else {
			vm.userService.getUsersByOrg(orgId)
                .subscribe(
					(result) => {
						vm.userList = result; vm.filteredUserList = result;
						vm.selectTopUser();
					},
					(error) => vm.log.error('Error loading users and roles (by OrgId = ' + orgId + ')', error, 'Error')
				);
		}
	}

	getUserRoles(user){
		let vm = this;
		let userId = user.uuid;
		vm.userRoleList = null;
		vm.userService.getAssignedRoles(userId)
            .subscribe(
				(result) => vm.userRoleList = result,
				(error) => vm.log.error('Error loading user roles', error, 'Error')
			);
	}

	searchUsers(){
		let vm = this;
		let searchTerm = this.searchTerm.trim().toLowerCase();

		if (searchTerm.length > 2)
		{
			vm.filteredUserList = vm.userList.filter((user) =>
				user.forename.toLowerCase().includes(searchTerm) ||
				user.surname.toLowerCase().includes(searchTerm)  ||
				user.username.toLowerCase().includes(searchTerm));
			vm.searched = true;
			vm.selectTopUser();
		}
		else
		{
			//reset users list back to original
			vm.filteredUserList = vm.userList;
			vm.searched = false;
			vm.selectTopUser();
		}

		// if (this.searchTerm) {
		// 	vm.userService.getUsersSearch(vm.searchTerm)
         //        .subscribe(
		// 			(result) => vm.userList = result,
		// 			(error) => vm.log.error('Error loading user search', error, 'Error')
		// 		);
		// 	vm.searched = true;
		// }
	}

	clearSearch(){
		let vm = this;
		vm.searched = false;
		vm.searchTerm = "";
		vm.filteredUserList = vm.userList;
	}

	setSelectedRole(role) {
		this.selectedRole = role;
	}

	tabChange($event: NgbTabChangeEvent) {
		this.activeTabId = $event.nextId;
	}

	getLoggedOnUsersOrganisations(){
		let vm = this;

		vm.userOrganisations = [];

		//super users get full access to all group hierarchy
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

	getLoggerOnUsersRoles(){
		this.securityService.getCurrentUser().organisationGroups[0].roles;
	}

	setOrganisation(org: OrgRole){
		let vm = this;
		vm.selectedOrganisation = org;
		vm.getUsersByOrg();
	}

	updateUser(editedUser: User){
		let vm = this;
		var index1 = 0;
		for(let user of vm.userList){
			if (user.uuid == editedUser.uuid){
				vm.userList[index1] = editedUser;
				if (vm.searched){
					var index2 = 0;
					for(let filteredUser of vm.filteredUserList){
						if (filteredUser.uuid == editedUser.uuid) {
							vm.filteredUserList[index2] = editedUser;
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
}

