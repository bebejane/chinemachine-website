import React, { Component } from 'react';
import './index.css';
import verificationService from '../../services/verificationService';
import appointmentService from '../../services/appointmentService';
import dictionaryService from '../../services/dictionaryService';
import userService from '../../services/userService';
import moment from 'moment';
import logo from '../../images/cm_logo_white_128px.png';
import { BiHome, BiStore } from 'react-icons/bi';
import { AiOutlineLogout } from 'react-icons/ai';

import Verification from '../verification';
import Loader from '../util/Loader';
import Button from '../util/Button';
import AccountAppointments from './AccountAppointments';
import AccountSettings from './AccountSettings';

const formatAppointmentTime = (app) => {
	const startDate = moment(app.startTime);
	const endDate = moment(app.endTime);
	return startDate.format('HH:mm') + ' to ' + endDate.format('HH:mm');
};

const SECTIONS = [
	{
		_id: 'appointments',
		name: 'Appointments',
		component: AccountAppointments,
		icon: BiHome,
	},
	{
		_id: 'settings',
		name: 'Account settings',
		component: AccountSettings,
		icon: BiStore,
	},
];
const HOME_SECTION = SECTIONS[0];

class Account extends Component {
	constructor(props) {
		super(props);
		this.state = {
			dict: {},
			sections: SECTIONS,
			loading: true,
			appointments: [],
			cancelling: false,
			user: undefined,
			updatingAccount: false,
		};
		this.handleUpdateAccount = this.handleUpdateAccount.bind(this);
		this.handleFormChange = this.handleFormChange.bind(this);
	}
	async componentDidMount() {
		document.title = 'Chinemachine / Account';
		this.setState({ loading: true });
		let user;

		try {
			user = await verificationService.getUser();
			if (!user) throw new Error('Not authorized');
			else this.setState({ user });
		} catch (err) {
			return this.handleLogout();
		}
		try {
			const dict = await dictionaryService.getDictionary();

			const appointments = await appointmentService.getAllByUser(user._id);
			this.setState(
				{ langCode: dict._langCode, dict, appointments },
				async () => {
					const sectionId = this.props.location.pathname
						.replace(/\/account/gi, '')
						.replace('/', '');
					if (sectionId) this.handleNavigation(sectionId);

					this.setState({ loading: false });
				}
			);
		} catch (error) {
			this.handleError(error);
		}

		this.props.history.listen((event) => {
			if (!event.state || !event.state.sectionId) return;
			const { sectionId } = event.state;
			const { sections } = this.state;
			const section = sections.filter(
				(sec) => sec.id === sectionId || sec._id === sectionId
			)[0];
			this.setState({ section: section || HOME_SECTION });
		});
	}

	componentWillUnmount() {}
	async handleUpdateAccount(e) {
		if (e) e.preventDefault();
		const { user } = this.state;

		this.setState({ updatingAccount: true, updated: false });
		try {
			const updatedUser = await userService.update(user._id, user);
			console.log(updatedUser);
			this.setState({
				user: updatedUser,
				updated: true,
				updatingAccount: false,
			});
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ updatingAccount: false });
	}
	async handleCancelAppointment(appointment) {
		this.setState({ cancelling: appointment._id });
		try {
			const { user } = this.state;
			const appointments = this.state.appointments.filter(
				(a) => a._id !== appointment._id
			);
			await appointmentService.cancel(user._id, appointment._id);
			this.setState({ appointments });
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ cancelling: false });
	}
	handleNavigation(sectionId) {
		this.props.history.push({
			pathname: '/account/' + sectionId,
			state: { sectionId },
		});
	}

	handleConfirmDeleteSection(id) {
		const deleteSection = this.state.sections.filter(
			(section) => section._id === id
		)[0];
		this.setState({ deleteSection, showDeleteSectionModal: true });
	}
	handleCloseDeleteSectionModal() {
		this.setState({ deleteSection: null, showDeleteSectionModal: false });
	}
	handleChangeLanguage(langCode) {
		this.setState({ langCode });
	}

	handleLogin(user) {
		this.setState({ showLogin: false });
		this.componentDidMount();
	}
	async handleLogout() {
		this.setState({ loading: true });
		try {
			await verificationService.logout();
			this.props.history.push('/verification/login?redirect=/account');
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ loading: false });
	}
	handleFormChange(e) {
		const { user } = this.state;
		user[e.target.id] = e.target.value;
		this.setState({ user });
	}
	handleError(err) {
		if (err && err.response && err.response.status === 401)
			return this.handleLogout();

		const error =
			err.response && err.response.data
				? err.response.data.message || err.response.data
				: err.message || err.toString();
		this.setState({ error });
	}
	handleCloseErrorModal() {
		this.setState({ error: null });
	}

	render() {
		const {
			dict,
			form,
			loading,
			error,
			showLogin,
			user,
			appointments,
			cancelling,
			updatingAccount,
		} = this.state;
		console.log(user)
		if (showLogin)
			return (
				<Verification
					type='login'
					redirect='/account'
					onLogin={this.handleLogin}
				/>
			);
		if (loading)
			return <Loader error={error} onRetry={() => this.componentDidMount()} />;

		return (
			<div id='account'>
				<div id='account'>
					<div id='account-header'>
						<div id='account-header-logo-wrap'>
							<a href='/'>
								<img src={logo} alt='Chinemachine' id='account-header-logo' />
							</a>
						</div>
						<h2 id='account-header-title'>
							{user ? user.firstName + ' ' + user.lastName : '...'}
						</h2>
						<div id='account-header-logout'>
							<a alt='Sign out' href='/verification/logout?redirect=/'>
								<AiOutlineLogout />
							</a>
						</div>
					</div>
					<div id='account-border'></div>
					<div id='account-content-wrap'>
						<div id='account-appointments'>
							<h3>{dict.myAppointments}</h3>
							{appointments.map((app, idx) => (
								<div key={idx} className='account-appointment'>
									<div className='account-appointment-wrap'>
										<span className='account-appointment-time'>
											{moment(app.startTime).format('dddd MMM Do')},{' '}
											{formatAppointmentTime(app)}
										</span>
										<br />
										{app.store.name}
										<br />
										{app.store.address}
										<br />
										{app.store.postalCode} {app.store.city}
									</div>
									<Button
										loading={cancelling === app._id}
										onClick={() => this.handleCancelAppointment(app)}
									>
										{dict.cancel}
									</Button>
								</div>
							))}
							{!appointments.length && (
								<div className='account-no-appointments'>
									{dict.noAppointmentsBooked}
								</div>
							)}
						</div>
						<div id='account-details'>
							<h3>{dict.myAccount}</h3>
							<div id='account-details-wrap'>
								<form onSubmit={this.handleUpdateAccount}>
									<input
										id='firstName'
										value={user.firstName}
										onChange={this.handleFormChange}
										autoComplete='off'
										placeholder='First name...'
										name='firstName'
										type='text'
									/>
									<br />
									<input
										id='lastName'
										value={user.lastName}
										onChange={this.handleFormChange}
										autoComplete='off'
										placeholder='Last name...'
										name='firstName'
										type='text'
									/>
									<br />
									{/*<input id='email' value={user.email} onChange={this.handleFormChange} autoComplete='off' placeholder='E-mail...' name='email' type='text'/><br/>*/}
									<input
										id='phone'
										value={user.phone}
										onChange={this.handleFormChange}
										autoComplete='off'
										placeholder='Phone...'
										name='phone'
										type='text'
									/>
									<br />
									<br />
									<Button type='submit' loading={updatingAccount}>
										{dict.save}
									</Button>
								</form>
								<br/>
								{user && user.role !== 'USER' &&
								<a href='/dashboard'>
									<Button type='button'>
										Go to Administration
									</Button>
								</a>
								}
							</div>
						</div>
						{error && <div className='account-error'>{error}</div>}
					</div>
				</div>
			</div>
		);
	}
}

export default Account;
