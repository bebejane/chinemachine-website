import React, { Component } from 'react';
import './UserSection.css';
import { capitalize, roles, debounce } from '../../util';
import Select from 'react-select';
import Modal from './Modal';
import Button from '../util/Button';
import { GrFormClose } from 'react-icons/gr';
import { BsTrash, BsEdit } from 'react-icons/bs';
import { FiEdit } from 'react-icons/fi';

import userService from '../../services/userService';

const defaultRole = roles.filter((r) => r.type === 'ADMINISTRATOR')[0];

const defaultForm = {
	_id: '',
	lastName: '',
	firstName: '',
	email: '',
	email2: '',
	password: '',
	password2: '',
	phone: '',
	role: defaultRole.type,
	roleName: defaultRole.name,
};

class UserSection extends Component {
	constructor(props) {
		super(props);
		this.state = {
			user: undefined,
			administrators: [],
			managers: [],
			groups: [],
			searchTerm: '',
			search: undefined,
			role: defaultRole,
			roles: [...roles],
			form: {
				...defaultForm,
			},
			editForm: {
				...defaultForm,
			},
			showDeleteModal: false,
			showAddUser: false,
		};
		this.handleAddUser = this.handleAddUser.bind(this);
		this.handleFormChange = this.handleFormChange.bind(this);
		this.handleEditFormChange = this.handleEditFormChange.bind(this);
		this.handleRoleChange = this.handleRoleChange.bind(this);
		this.handleEditRoleChange = this.handleEditRoleChange.bind(this);
		this.handleDeleteUser = this.handleDeleteUser.bind(this);
		this.handleToggleEditUser = this.handleToggleEditUser.bind(this);
		this.handleEditUser = this.handleEditUser.bind(this);
		this.handleShowAddUser = this.handleShowAddUser.bind(this);
		this.handleCloseDeleteModal = this.handleCloseDeleteModal.bind(this);
		this.handleSearch = this.handleSearch.bind(this);

		this.debounceSearch = debounce(async () => {
			const { searchTerm } = this.state;
			const search = await userService.search(searchTerm);
			this.setState({ search: searchTerm === '' ? [] : search });
		}, 200);
	}
	componentDidMount() {
		this.loadUsers();
	}
	async loadUsers() {
		this.setState({ loading: true });
		try {
			const all = await userService.getAll();
			const groups = [
				{
					role: 'ADMINISTRATOR',
					name: 'Administrators',
					users: all.filter((usr) => usr.role === 'ADMINISTRATOR'),
				},
				{
					role: 'MANAGER',
					name: 'Managers',
					users: all.filter((usr) => usr.role === 'MANAGER'),
				},
				{
					role: 'EMPLOYEE',
					name: 'Employees',
					users: all.filter((usr) => usr.role === 'EMPLOYEE'),
				},
			];
			this.setState({ groups });
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ loading: false });
	}
	handleRoleChange({ value }) {
		const { roles, form } = this.state;
		form.role = value;
		form.roleName = roles.filter((r) => r.type === value)[0].name;

		this.setState({ form });
	}
	handleEditRoleChange({ value }) {
		const { roles, editForm } = this.state;
		editForm.role = value;
		editForm.roleName = roles.filter((r) => r.type === value)[0].name;

		this.setState({ editForm });
	}
	async handleAddUser(e) {
		e.preventDefault();
		const { form } = this.state;
		this.setState({ saving: true });
		try {
			const user = await userService.add({ ...form, activated: true });
			this.setState({ user, form: { ...defaultForm } });
			this.loadUsers();
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ saving: false });
	}
	async handleEditUser(e) {
		if (e) e.preventDefault();
		const { editForm } = this.state;
		const user = {
			_id: editForm._id,
			role: editForm.role,
			firstName: editForm.firstName,
			lastName: editForm.lastName,
			phone: editForm.phone,
		};
		this.setState({
			saving: true,
			search: undefined,
			searchTerm: '',
			editForm: {},
		});
		try {
			const updatedUser = await userService.update(user._id, user);
			await this.loadUsers();
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ saving: false });
	}
	async deleteUser(user) {
		this.setState({ saving: true });

		try {
			const { search } = this.state;
			const userId = user._id || user.id;

			user = await userService.delete(userId);
			this.setState({ search: search.filter((s) => s.userId === userId) });
			this.loadUsers();
		} catch (err) {
			this.handleError(err.message);
		}
		this.setState({ saving: false });
		this.handleCloseDeleteModal();
	}
	handleFormChange(e) {
		const { form } = this.state;
		form[e.target.id] = e.target.value;
		this.setState({ form });
	}
	handleError(err) {
		console.error('ERRROORROR');
		this.setState({ error: err, saving: false });
		this.props.onError(err);
	}
	handleDeleteUser(user) {
		console.log('handleDeleteUser', user);
		this.setState({ user, showDeleteModal: true });
	}
	handleToggleEditUser(user) {
		let { editForm, roles } = this.state;
		if (editForm._id == user._id) editForm = {};
		else {
			editForm = {
				_id: user._id,
				role: user.role,
				roleName: roles.filter((r) => r.type === user.role)[0].name,
				rolesOptions: roles.map((role) => {
					return { value: role.type, label: role.name };
				}),
				firstName: user.firstName,
				lastName: user.lastName,
				phone: user.phone,
				email: user.email,
			};
		}
		this.setState({ editForm });
	}
	handleEditFormChange(e) {
		const { editForm } = this.state;
		editForm[e.target.id] = e.target.value;
		this.setState({ editForm });
	}
	handleCloseDeleteModal() {
		this.setState({ user: undefined, showDeleteModal: false });
	}
	handleShowAddUser() {
		this.setState({ showAddUser: !this.state.showAddUser });
	}
	async handleSearch(e) {
		const searchTerm = e.target.value;
		this.setState({ searchTerm });
		this.debounceSearch();
	}
	generateUser(u, editForm, saving, showRole) {
		return (
			<div key={'u' + u.email} className='dash-user-wrap'>
				<div className='dash-user-row' onClick={() => this.handleToggleEditUser(u)}>
					<div className='dash-user-details'>
						<div className='dash-user-name'>
							{capitalize(u.lastName)}, {capitalize(u.firstName)}
						</div>
						<div className='dash-user-email'>{u.email}</div>
						{showRole && <div className='dash-user-role'>{capitalize(u.role)}</div>}
					</div>
					<div className='dash-user-buttons'>
						<div
							className={editForm._id === u._id ? 'dash-user-edit-btn-selected' : 'dash-user-edit-btn'}
							onClick={() => this.handleToggleEditUser(u)}
						>
							<FiEdit />
						</div>
					</div>
				</div>
				<form
					onSubmit={this.handleEditUser}
					className={'dash-user-edit-form'}
					style={{ display: editForm._id === u._id ? 'flex' : 'none' }}
				>
					<Select
						onChange={this.handleEditRoleChange}
						value={{ value: editForm.role, label: editForm.roleName }}
						isSearchable={false}
						options={editForm.rolesOptions}
					/>
					<input
						id='firstName'
						placeholder={'First name...'}
						autoComplete={'off'}
						value={editForm.firstName}
						type='text'
						onChange={this.handleEditFormChange}
					/>
					<input
						id='lastName'
						placeholder={'Last name...'}
						autoComplete={'off'}
						value={editForm.lastName}
						type='text'
						onChange={this.handleEditFormChange}
					/>
					<input
						id='phone'
						placeholder={'Phone...'}
						autoComplete={'off'}
						value={editForm.phone}
						type='text'
						onChange={this.handleEditFormChange}
					/>
					<input
						id='email'
						disabled={true}
						placeholder={'E-mail...'}
						autoComplete={'off'}
						value={editForm.email}
						type='text'
						onChange={this.handleEditFormChange}
					/>
					{/*<input id='email2' placeholder={'Re-type e-mail...'} autoComplete={'off'} value={editForm.email2} type='text' onChange={this.handleEditFormChange}/>
					<input id='password' placeholder={'Password...'} autoComplete={'off'} value={editForm.password} type='password' onChange={this.handleEditFormChange}/>
					<input id='password2' placeholder={'Re-type password...'} autoComplete={'off'} value={editForm.password2} type='password' onChange={this.handleEditFormChange}/>
					*/}
					<input id='userId' value={editForm._id} type='hidden' />
					<div className={'dash-user-form-buttons'}>
						<Button type='submit' loading={saving}>
							SAVE
						</Button>
						<Button type='button' loading={saving} onClick={() => this.handleDeleteUser(u)}>
							DELETE
						</Button>
					</div>
				</form>
			</div>
		);
	}
	render() {
		const { groups, loading, saving, user, roles, form, editForm, showDeleteModal, term, search, searchTerm } =
			this.state;

		if (loading) return null;

		return (
			<div id='dash-user-section'>
				{groups.map((group, idx) => (
					<div key={'group' + idx} className='dash-user-group'>
						<div className='dash-user-header'>
							<h2>{group.name}</h2>
						</div>
						<div className='dash-users'>
							{group.users.length ? (
								group.users.map((u) => this.generateUser(u, editForm, saving))
							) : (
								<span>No users in this group...</span>
							)}
						</div>
					</div>
				))}

				<div key={'search'} className='dash-user-group'>
					<div className='dash-user-header'>
						<h2>Search</h2>
					</div>
					<input
						type='text'
						className='dash-users-search-input'
						placeholder='Name or email...'
						value={searchTerm}
						onChange={this.handleSearch}
					/>
					<div className='dash-users-search'>
						{search && search.length ? (
							search.map((u) => this.generateUser(u, editForm, saving, true))
						) : (
							<span className='dash-users-search-empty'>
								{Array.isArray(search) && searchTerm ? 'No users found...' : ''}
							</span>
						)}
					</div>
				</div>
				<div className='dash-user-add'>
					<div id={'dash-user-add-header'} onClick={this.handleShowAddUser}>
						<h2>Add new user</h2>
					</div>
					<form className='dash-user-form' onSubmit={this.handleAddUser}>
						<Select
							id='dash-user-role'
							onChange={this.handleRoleChange}
							value={{ value: form.role, label: form.roleName }}
							isSearchable={false}
							options={roles.map((role) => {
								return { value: role.type, label: role.name };
							})}
						/>
						<input
							id='firstName'
							placeholder={'First name...'}
							autoComplete={'off'}
							value={form.firstName}
							type='text'
							onChange={this.handleFormChange}
						/>
						<input
							id='lastName'
							placeholder={'Last name...'}
							autoComplete={'off'}
							value={form.lastName}
							type='text'
							onChange={this.handleFormChange}
						/>
						<input
							id='email'
							placeholder={'E-mail...'}
							autoComplete={'off'}
							value={form.email}
							type='text'
							onChange={this.handleFormChange}
						/>
						<input
							id='email2'
							placeholder={'Re-type e-mail...'}
							autoComplete={'off'}
							value={form.email2}
							type='text'
							onChange={this.handleFormChange}
						/>
						<input
							id='password'
							placeholder={'Password...'}
							autoComplete={'off'}
							value={form.password}
							type='password'
							onChange={this.handleFormChange}
						/>
						<input
							id='password2'
							placeholder={'Re-type password...'}
							autoComplete={'off'}
							value={form.password2}
							type='password'
							onChange={this.handleFormChange}
						/>
						<input
							id='phone'
							placeholder={'Phone...'}
							autoComplete={'off'}
							value={form.phone}
							type='text'
							onChange={this.handleFormChange}
						/>
						<div className={'dash-user-save'}>
							<Button type='submit' loading={saving}>
								SAVE
							</Button>
						</div>
					</form>
				</div>
				{showDeleteModal && user && (
					<Modal
						header={'Delete'}
						message={'Delete user ' + user.email + '?'}
						onConfirm={() => this.deleteUser(user)}
						onCancel={this.handleCloseDeleteModal}
					/>
				)}
			</div>
		);
	}
}

export default UserSection;
