import React, { Component } from 'react';
import './index.css';
import logo from '../../images/cm_logo_white_128px.png';
import Loader from '../util/Loader';
import Button from '../util/Button';
import AppointmentDate from './AppointmentDate';
import AppointmentVerification from './AppointmentVerification';
import AppointmentBook from './AppointmentBook';
import AppointmentConfirmation from './AppointmentConfirmation';
import AppointmentNav from './AppointmentNav';
import dictionaryService from '../../services/dictionaryService';
import appointmentService from '../../services/appointmentService';

const VIEWS = ['date', 'verification', 'book', 'confirmation'];
const defaultState = {
	dict: undefined,
	loading: true,
	saving: false,
	done: false,
	date: new Date(),
	prev: undefined,
	next: undefined,
	available: [],
	selected: undefined,
	appointment: undefined,
	view: VIEWS[0],
	views: VIEWS,
	viewIndex: 0,
	nextView: 'verification',
	store: undefined,
	langCode: 'en',
	user: undefined,
};
class Appointment extends Component {
	constructor(props) {
		super(props);

		this.state = {
			...defaultState,
		};

		this.handleSelectAvailable = this.handleSelectAvailable.bind(this);
		this.handleLogin = this.handleLogin.bind(this);
		this.handleBookAppointment = this.handleBookAppointment.bind(this);
		this.handleRefresh = this.handleRefresh.bind(this);
		this.handleDateChange = this.handleDateChange.bind(this);
		this.handleCloseError = this.handleCloseError.bind(this);
		this.handlePrev = this.handlePrev.bind(this);
		this.handleNext = this.handleNext.bind(this);
	}
	async componentDidMount() {
		document.title = 'Chinemachine / Appointment';
		this.setState({ loading: true });
		try {
			const dict = await dictionaryService.getDictionary();

			this.setState({ dict, langCode: dict._langCode });
			await this.loadAppointAvailabilities();
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ loading: false });
	}
	async loadAppointAvailabilities() {
		console.log('load availabilities');
		//this.setState({loading:true})
		try {
			const { date } = this.state;
			const available = await appointmentService.getByMonth(date.getFullYear(), date.getMonth());
			this.setState({ available });
		} catch (err) {
			this.handleError(err);
		}
		//this.setState({loading:false})
	}

	handleSelectAvailable(selected) {
		this.setState({ selected }, () => this.handleView('date'));
	}
	async handleBookAppointment() {
		const { selected, user } = this.state;
		if (!selected || !user) return this.handleError('Not valid appointment!');

		this.setState({ saving: true });

		try {
			const appointment = await appointmentService.book(user._id, selected._id);
			appointment.user = user;
			this.setState({ appointment }, () => this.handleView('confirmation'));
		} catch (err) {
			console.log(err);
			this.handleError(err);
		}

		this.setState({ saving: false });
	}
	validateBooking() {
		return true;
	}
	handleLogin(user) {
		console.log('handle login......', user);
		const { appointment } = this.state;
		if (appointment) appointment.user = user;
		this.setState({ user, appointment }, () => {
			this.handleView('book');
		});
	}
	handleView(view) {
		console.log('handle view', view);
		const { selected, user } = this.state;
		if (view === 'date') this.setState({ prev: undefined, next: selected ? true : false });
		else if (view === 'verification') this.setState({ prev: true, next: user ? true : false });
		else if (view === 'book') this.setState({ prev: true, next: undefined });
		else if (view === 'confirmation') this.setState({ prev: undefined, next: undefined });

		this.setState({ view });
	}
	handlePrev() {
		let { viewIndex } = this.state;
		const newViewIndex = --viewIndex;
		this.setState({ viewIndex: newViewIndex }, () => {
			this.handleView(VIEWS[newViewIndex]);
		});
	}
	handleNext() {
		let { view, viewIndex, selected, user } = this.state;
		const newViewIndex = ++viewIndex;

		if (view === 'date' && !selected) return;
		else if (view === 'verification' && !user) return;
		else if (view === 'book' && (!selected || user)) return;
		else if (view === 'confirmation') return;

		this.setState({ viewIndex: newViewIndex }, () => {
			this.handleView(VIEWS[newViewIndex]);
		});
	}
	handleDateChange(date) {
		this.setState({ date });
	}
	handleError(err) {
		console.log(err);
		const error = err.response && err.response.data ? err.response.data.message : err.message || err.toString() || err;
		this.setState({ error: error || 'Unknown error' });
	}
	handleCloseError() {
		this.setState({ error: undefined });
	}
	handleRefresh() {
		const { date } = this.state;
		this.setState({ ...defaultState, date }, () => this.componentDidMount());
	}
	render() {
		const { date, loading, saving, selected, appointment, view, prev, next, user, error, dict, langCode } = this.state;
		console.log(selected);

		if (loading) return <Loader />;

		return (
			<div id='appointment'>
				<div id='appointment-header'>
					<div id='appointment-header-logo-wrap'>
						<a href='/'>
							<img src={logo} alt='Chinemachine' id='appointment-header-logo' />
						</a>
					</div>
					<h2>{dict.bookAppointment}</h2>
				</div>
				<div id='appointment-border'></div>
				<div id='appointment-content-wrap'>
					<div id='appointment-content'>
						{view === 'date' ? (
							<AppointmentDate
								dict={dict}
								langCode={langCode}
								date={date}
								selected={selected}
								onDateChange={this.handleDateChange}
								onSelectAvailable={this.handleSelectAvailable}
							/>
						) : view === 'verification' ? (
							<AppointmentVerification type='login' onLogin={this.handleLogin} />
						) : view === 'book' ? (
							<AppointmentBook selected={selected} dict={dict} user={user} />
						) : view === 'confirmation' ? (
							<AppointmentConfirmation dict={dict} appointment={appointment} />
						) : null}
						{view !== 'confirmation' && (
							<AppointmentNav
								selected={selected}
								dict={dict}
								prev={prev}
								next={next}
								book={view === 'book'}
								onPrev={this.handlePrev}
								onNext={this.handleNext}
								onBookAppointment={this.handleBookAppointment}
							/>
						)}
						{loading && <Loader />}
						{saving && <Loader message={dict.savingApointment} />}
						{error && (
							<div id='appointment-error-wrap'>
								<div id='appointment-error'>
									<div id='appointment-error-header'>Oh no...</div>
									<div id='appointment-error-message'>{error}</div>
									<div id='appointment-error-close'>
										<Button className={'appointment-button'} type='button' onClick={this.handleCloseError}>
											{dict.back}
										</Button>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}
}
export default Appointment;
