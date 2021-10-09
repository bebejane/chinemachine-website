export const isAdministrator = (role) =>{
    return role === 'ADMINISTRATOR' || role === 'ROOT'
}
export const capitalize = (str, lower = true) =>{
  return (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase());
}
export const roles = [
{
	_id: 'administrator',
	name: 'Administrator',
	type: 'ADMINISTRATOR'
}, {
	_id: 'manager',
	name: 'Manager',
	type: 'MANAGER'
}, {
	_id: 'employee',
	name: 'Employee',
	type: 'EMPLOYEE'
}, 
{
	_id: 'user',
	name: 'User',
	type: 'USER'
}]

export const debounce = (callback, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), delay);
  };
};