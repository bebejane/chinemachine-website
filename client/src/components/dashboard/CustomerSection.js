import React, { Component } from 'react';
import './CustomerSection.css';
import { capitalize, roles } from '../../util';
import Select from 'react-select';
import Modal from './Modal';
import Button from '../util/Button';
import { GrFormClose } from 'react-icons/gr';
import userService from '../../services/userService';
const defaultRole = roles.filter((r) => r.type == 'USER')[0];

const defaultForm = {
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

class CustomerSection extends Component {
	constructor(props) {
		super(props);
		this.state = {
			user: undefined,
			customers: [],
			term: '',
			search: [],
			role: defaultRole,
			roles: [...roles],
			form: {
				...defaultForm,
			},
			showDeleteModal: false,
			showAddUser: false,
		};
		this.handleAddUser = this.handleAddUser.bind(this);
		this.handleFormChange = this.handleFormChange.bind(this);
		this.handleDeleteUser = this.handleDeleteUser.bind(this);
		this.handleShowAddUser = this.handleShowAddUser.bind(this);
		this.handleCloseDeleteModal = this.handleCloseDeleteModal.bind(this);
	}
	componentDidMount() {
		//this.loadUsers()
	}
	async loadUsers() {
		this.setState({ loading: true });
		try {
			const all = await userService.getAll();
			const customers = all.filter((usr) => usr.role === 'USER');
			this.setState({ customers });
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ loading: false });
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
		this.setState({ error: err, saving: false });
		this.props.onError(err);
	}
	handleDeleteUser(user) {
		this.setState({ user, showDeleteModal: true });
	}
	handleCloseDeleteModal() {
		this.setState({ user: undefined, showDeleteModal: false });
	}
	handleShowAddUser() {
		this.setState({ showAddUser: !this.state.showAddUser });
	}
	async handleSearch(e) {
		const term = e.target.value;
		const { customers } = this.state;
		const search = await userService.search(term);
		this.setState({ term, search: term === '' ? [] : search });
	}
	render() {
		const { loading, saving, user, roles, form, showDeleteModal, term, search } = this.state;

		if (loading) return null;

		return (
			<div id='dash-customer-section'>
				<div className='dash-customers'>
					<div key={'search'} id='dash-customer-search'>
						<h2>Search customers</h2>
						<form id='dash-customer-search-form' onSubmit={(e) => this.onSearch(e)}>
							<input
								id='dash-customer-search-input'
								placeholder={'Customer name...'}
								value={term}
								onChange={(e) => this.handleSearch(e)}
							/>
						</form>
						{search.map((u) => generateUser(u, () => this.handleDeleteUser(u)))}
					</div>
				</div>
				<div id='dash-customer-add'>
					<div id={'dash-customer-add-header'} onClick={this.handleShowAddUser}>
						<h2>Add customer</h2>
					</div>
					<form id='dash-customer-form' onSubmit={this.handleAddUser} className={'dash-customer-form'}>
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
						<div id={'dash-customer-save'}>
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

const generateUser = (u, deleteUser) => {
	return (
		<div key={'u' + u.email} className='dash-customer-wrap'>
			<div className='dash-customer-details'>
				<div className='dash-customer-name'>
					{capitalize(u.lastName)}, {capitalize(u.firstName)}
				</div>
				<div className='dash-customer-email'>
					<a href={'mailto:' + u.email}>{u.email}</a>
				</div>
				<div className='dash-customer-email'>
					<a href={'tel:' + u.phone}>{u.phone}</a>
				</div>
			</div>
		</div>
	);
};
export default CustomerSection;
