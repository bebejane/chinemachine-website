const Roles = {
	USER: 'USER',
	EMPLOYEE: 'EMPLOYEE',
	MANAGER: 'MANAGER',
	ADMINISTRATOR: 'ADMINISTRATOR',
	ROOT: 'ROOT',
};
const RolesOrder = Object.keys(Roles);
const verifyRole = (roles) => {
	if (!roles) return false;

	roles = Array.isArray(roles) ? roles : [roles];

	for (var i = 0; i < roles.length; i++) {
		if (!roles[i] || !Roles[roles[i]]) return false;
	}

	return true;
};
const isRoleAuthorized = (role, accessRoles) => {
	if (!role || !accessRoles) return false;

	accessRoles = (!Array.isArray(accessRoles) ? [accessRoles] : accessRoles).filter((r) => r);

	if (!verifyRole(accessRoles)) return false;

	if (!role || !accessRoles || !accessRoles.length) return false;

	let roleIdx = RolesOrder.indexOf(role);
	let accessRoleIdx = RolesOrder.length - 1;
	accessRoles.forEach(
		(r, idx) => (accessRoleIdx = RolesOrder.indexOf(r) < accessRoleIdx ? RolesOrder.indexOf(r) : accessRoleIdx)
	);
	return roleIdx >= accessRoleIdx;
};
const isAdministrator = (role) => {
	if (!role) return false;
	else if (!verifyRole(role)) return false;
	else return [Roles.ADMINISTRATOR, Roles.ROOT, Roles.MANAGER].includes(role);
};
module.exports = {
	Roles,
	isRoleAuthorized,
	isAdministrator,
	verifyRole,
};
