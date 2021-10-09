import React, { Component } from 'react';
import './AppointmentCalendar.css';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import moment from 'moment-timezone';
import Hammer from 'rc-hammerjs';
import Button from '../util/Button';
import Loader from '../util/Loader';
import Calendar from 'react-calendar';

import dictionaryService from '../../services/dictionaryService';
import storeService from '../../services/storeService';
import userService from '../../services/userService';
import appointmentService from '../../services/appointmentService';
import { findTimeZone, getZonedTime, getUnixTime } from 'timezone-support';

const REFRESH_INTERVAL = 30000;

const createAvailableTime = (year, month, day, hour, minute, store) => {
	const startTime =
		moment
			.tz(moment({ year, month, day, hour, minute }).format('YYYY-MM-DD HH:mm'), 'YYYY-MM-DD HH:mm', 'Europe/Paris')
			.unix() * 1000;
	const endTime = startTime + 30 * 60 * 1000;
	return {
		_id: startTime + '-' + endTime,
		startTime: startTime,
		endTime: endTime,
		storeId: store._id,
		store,
		generated: true,
	};
};
const generateAvailable = (date, store) => {
	const available = [];
	for (var i = 0, h = 12, m = 0; h < 20; i++, h += 0.5) {
		available.push(createAvailableTime(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(h), m, store));
		m = m === 0 ? 30 : 0;
	}
	return available;
};

class AppointmentCalendar extends Component {
	constructor(props) {
		super(props);
		this.state = {
			date: props.date || new Date(),
			selected: props.selected || undefined,
			availability: props.availability,
			dict: {},
			loading: true,
			loadingAppointment: false,
			saving: false,
			cancelling: false,
			refreshing: false,
			error: undefined,
			done: false,
			calendarDate: undefined,
			store: undefined,
			stores: [],
			avail: undefined,
			available: [],
			availableMonth: [],
			appointment: undefined,
			updatingSlot: undefined,
			customerSearchTerm: '',
			customerSearch: [],
			customer: undefined,
			booking: false,
		};

		this.handleCalendarChange = this.handleCalendarChange.bind(this);
		this.handleDateChanged = this.handleDateChanged.bind(this);
		this.handleIsDateDisabled = this.handleIsDateDisabled.bind(this);
		this.handleDeleteAppointment = this.handleDeleteAppointment.bind(this);
		this.handleIsDateAvailable = this.handleIsDateAvailable.bind(this);
		this.handleStartDateChange = this.handleStartDateChange.bind(this);
		this.handleStoreChange = this.handleStoreChange.bind(this);
		this.handleCustomerSearch = this.handleCustomerSearch.bind(this);
		this.handleCustomerSearchSelected = this.handleCustomerSearchSelected.bind(this);
		this.handleCustomerBooking = this.handleCustomerBooking.bind(this);
		this.refreshInterval = null;
	}
	async componentDidMount() {
		let { dict, langCode } = this.props;
		this.setState({ loading: true });
		try {
			if (!dict) dict = await dictionaryService.getDictionary(langCode);
			const stores = await storeService.getAll();
			const store = stores.length ? stores[1] : undefined;
			const { date } = this.state;
			await this.setStateAsync({ dict, stores, store, date });
			await this.loadAll(date);
			this.refreshInterval = setInterval(() => this.loadAll(this.state.date, true), REFRESH_INTERVAL);
		} catch (err) {
			this.handleError(err);
		}

		this.setState({ loading: false });
	}
	setStateAsync(state) {
		return new Promise((resolve) => {
			this.setState(state, resolve);
		});
	}

	async loadAll(date, background) {
		await this.loadAppointmentsByMonth(date, background);
		await this.loadAppointments(date, background);
	}
	componentWillUnmount() {
		clearInterval(this.refreshInterval);
	}
	async loadAppointments(date, background) {
		const { store } = this.state;
		const { edit } = this.props;

		date = date || this.state.date ? new Date(date || this.state.date) : new Date();

		if (!store) return;

		if (!background) this.setState({ refreshing: true, date });
		try {
			let available = await appointmentService.getByDate(
				date.getFullYear(),
				date.getMonth(),
				date.getDate(),
				store._id
			);
			if (edit) {
				available = generateAvailable(date, store).map((avail, idx) => {
					return (
						available.filter(
							(a) =>
								moment(a.startTime).format('HH:mm') === moment(avail.startTime).format('HH:mm') &&
								moment(a.endTime).format('HH:mm') === moment(avail.endTime).format('HH:mm')
						)[0] || avail
					);
				});
			} else
				available = available.filter(
					(avail) =>
						!avail.userId &&
						avail.status === 'ACTIVE' &&
						!moment(avail.startTime).isBefore(moment().tz('Europe/Paris'), 'day')
				);

			this.setState({ available, date });
		} catch (err) {
			this.handleError(err);
		}

		this.setState({ refreshing: false });
	}
	async loadAppointmentsByMonth(date, background) {
		const { store } = this.state;
		const { edit } = this.props;

		date = date || this.state.date ? new Date(date || this.state.date) : new Date();
		if (!background) this.setState({ refreshing: true });
		try {
			let availableMonth = await appointmentService.getByMonth(date.getFullYear(), date.getMonth(), store._id);
			if (!edit)
				availableMonth = availableMonth.filter(
					(avail) =>
						!avail.userId &&
						avail.status === 'ACTIVE' &&
						!moment(avail.startTime).isBefore(moment().tz('Europe/Paris'), 'day')
				);

			this.setState({ availableMonth, date });
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ refreshing: false });
	}

	updateAvailabilities(availability) {
		let { available, availableMonth } = this.state;
		available = available.map((avail) =>
			avail._id === availability._id ||
			(avail.startTime === availability.startTime && avail.endTime === availability.endTime)
				? availability
				: avail
		);
		availableMonth = availableMonth.map((avail) =>
			avail._id === availability._id ||
			(avail.startTime === availability.startTime && avail.endTime === availability.endTime)
				? availability
				: avail
		);
		this.setState({ available, selected: availability, availableMonth });
	}
	removeAvailability(id) {
		let { selected, available, availableMonth } = this.state;
		selected = {
			...selected,
			generated: true,
			_id: new Date(selected.startTime).getTime() + '-' + new Date(selected.endTime).getTime(),
		};
		available = available.map((avail) => (avail._id === id ? selected : avail));
		availableMonth = availableMonth.filter((avail) => avail._id !== id);
		this.setState({ available, selected, availableMonth });
	}
	handleCalendarChange(date) {
		this.setState({ date });
	}
	async handleDateChanged(newDate) {

		await this.loadAppointments(newDate);
		this.setState({ selected: undefined });
		if (this.props.onChange) this.props.onChange(newDate);
	}
	handleStartDateChange({ activeStartDate }) {
		this.setState({ appointment: undefined });
		this.loadAppointments(activeStartDate);
	}
	async handleToggleAvailability(availability) {
		const { edit, langCode } = this.props;
		const { store } = this.state;
		if (!edit) return;

		this.setState({ saving: true, updatingSlot: availability._id });
		if (!availability.userId) {
			try {
				if (!availability.generated) {
					await appointmentService.delete(availability._id);
					this.removeAvailability(availability._id);
				} else {
					const newAvailability = await appointmentService.add({
						...availability,
						langCode,
						_id: undefined,
						storeId: store._id,
					});
					this.updateAvailabilities(newAvailability);
				}
				this.loadAll(this.state.date, true);
			} catch (err) {
				this.handleError(err);
			}
		} else {
			try {
				const appointment = await appointmentService.get(availability._id);
				this.setState({ appointment });
			} catch (err) {
				this.handleError(err);
			}
		}
		this.setState({ saving: false, updatingSlot: undefined });
	}

	async handleSelected(selected) {

		this.setState({ selected, loadingAppointment: selected.userId }, async () => {

			if (selected.userId) {
				try {
					selected.appointment = await appointmentService.get(selected._id);

					this.setState({ selected, loadingAppointment: false }, () => {
						document.getElementById('ac-appointment').scrollIntoView();
					});
				} catch (err) {
					this.setState({ loadingAppointment: false });
					return this.handleError(err);
				}
			}
			if (this.props.onSelect) this.props.onSelect(selected);
		});
	}
	handleIsDateDisabled({ activeStartDate, date, view }) {
		return false;
		/*
        const {availableMonth} = this.state;
        const {edit} = this.props;
        if(edit) 
            return false;
        const available = availableMonth.filter((avail)=> moment(avail.startTime).isSame(moment(date), 'day'))
        return available.length === 0
        */
	}
	handleIsDateAvailable({ activeStartDate, date, view }) {
		const { availableMonth } = this.state;
		const { edit } = this.props;
		let available = availableMonth.filter((avail) => moment.tz(avail.startTime, 'Europe/Paris').isSame(date, 'day'));
		let booked = available.filter((avail) => avail.status === 'BOOKED').length > 0;
		//if(available.length) console.log(date, available)
		return available.length ? (booked ? 'ac-calendar-booked' : 'ac-calendar-active') : true;
	}
	handleTileContent({ date, view }) {}
	async handleDeleteAppointment(id) {
		this.setState({ saving: true });
		try {
			await appointmentService.delete(id);
			this.setState({ appointment: undefined, selected: undefined });
			this.loadAppointments(this.state.date, true);
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ saving: false });
	}
	async handleCancelAppointment(appointment) {
		this.setState({ cancelling: true });
		try {
			await appointmentService.cancel(appointment.userId, appointment._id);
			this.loadAppointments(this.state.date, true);
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ cancelling: false });
	}
	async handleStoreChange(opt) {
		const { stores } = this.state;
		const store = stores.filter((s) => s._id === opt.value)[0];
		await this.setStateAsync({ store, selected: undefined });
		this.loadAll();
	}
	getMaxDate() {
		const { edit } = this.props;
		return edit
			? moment().tz('Europe/Paris').add('months', 12).toDate()
			: moment().tz('Europe/Paris').add('months', 2).toDate();
	}
	getMinDate() {
		const { edit } = this.props;
		return edit ? moment().tz('Europe/Paris').subtract('months', 12).toDate() : new Date();
	}
	handleError(err) {
		const error = err.response && err.response.data ? err.response.data.message : err.message || err.toString();
		this.setState({ error });
		if (this.props.onError) this.props.onError(err);
	}
	handleCustomerSearch(customerSearchTerm) {
		this.setState({ customerSearchTerm });

		return new Promise(async (resolve, reject) => {
			if (customerSearchTerm.length < 2) return resolve([]);
			try {
				let customerSearch = await userService.search(customerSearchTerm);
				customerSearch = customerSearch.map((c) => {
					return {
						label: c.firstName + ' ' + c.lastName + ' (' + c.email + ')',
						value: c._id,
					};
				});
				resolve(customerSearch);
				this.setState({ customerSearch });
			} catch (err) {
				reject(err);
			}
		});
	}
	handleCustomerSearchSelected(customer, action) {
		this.setState({ customer });
	}
	async handleCustomerBooking(e) {
		e.preventDefault();

		const { customer, selected } = this.state;

		if (!customer) return this.handleError('Not a valid customer');
		if (!selected) return this.handleError('No appointment time selected');

		const userId = customer.value;
		const appointmentId = selected._id;

		this.setState({ booking: true });
		try {
			const appointment = await appointmentService.bookInternal(userId, appointmentId);
			selected.appointment = appointment;
			this.setState({ selected });
			await this.loadAll();
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ booking: false });
	}
	render() {
		const {
			dict,
			date,
			loading,
			loadingAppointment,
			updatingSlot,
			saving,
			cancelling,
			refreshing,
			available,
			availableMonth,
			selected,
			store,
			stores,
			customerSearch,
			customerSearchTerm,
			customer,
			booking,
		} = this.state;

		const { edit, langCode } = this.props;
		const minDate = this.getMinDate();
		const selectStyle = {
			valueContainer: (provided, state) => {
				return { ...provided, justifyContent: 'center', fontWeight: 'bold' };
			},
		};

		const slots = available.map((a, idx) => {
			let className;
			if (a.status === 'CANCELLED' && selected && selected._id === a._id) className = 'ac-slot-cancelled-selected';
			else if (a.status === 'CANCELLED') className = 'ac-slot-cancelled';
			else if (a.userId && selected && selected._id === a._id) className = 'ac-slot-booked-selected';
			else if (a.userId) className = 'ac-slot-booked';
			else if (selected && selected._id === a._id && !selected.generated) className = 'ac-slot-selected-active';
			else if (selected && selected._id === a._id && selected.generated) className = 'ac-slot-selected-deactivated';
			else if (!a.generated) className = 'ac-slot-available';
			else className = 'ac-slot';

			return (
				<Hammer
					key={'hmr-' + idx}
					onDoubleTap={() => this.handleToggleAvailability(a)}
					onTap={() => this.handleSelected(a)}
				>
					<div key={'appointment' + idx} className={className}>
						<div className='ac-slot-time'>
							{a.status === 'CANCELLED'
								? 'CANCELLED'
								: moment.tz(a.startTime, 'Europe/Paris').format('HH:mm') +
								  ' - ' +
								  moment.tz(a.endTime, 'Europe/Paris').format('HH:mm')}
						</div>
						{updatingSlot === a._id && <Loader styles={{ backgroundColor: 'rgb(221, 221, 221)' }} type='fast' />}
					</div>
				</Hammer>
			);
		});

		if (loading) return <Loader />;
		
		return (
			<div id='ac-wrap'>
				<div id='ac'>
					{store && stores && (
						<div id='ac-appointment-store'>
							<Select
								onChange={this.handleStoreChange}
								value={{
									value: store._id,
									label: store.name + ', ' + store.city + ' (' + store.postalCode + ')',
								}}
								menuPlacement='bottom'
								isSearchable={false}
								styles={selectStyle}
								options={stores.map((store) => {
									return {
										value: store._id,
										label: store.name + ', ' + store.city + ' (' + store.postalCode + ')',
									};
								})}
							/>
						</div>
					)}
					<Calendar
						minDate={minDate}
						//maxDate={maxDate}
						maxDetail={'month'}
						minDetail={'month'}
						locale={langCode === 'fr' ? 'fr-FR' : 'en-EN'}
						onChange={this.handleDateChanged}
						tileDisabled={this.handleIsDateDisabled}
						tileClassName={(data) => this.handleIsDateAvailable(data)}
						tileContent={(data) => this.handleTileContent(data)}
						value={date}
						next2Label={null}
						prev2Label={null}
						showNeighboringMonth={false}
						onActiveStartDateChange={this.handleStartDateChange}
					/>
					<div id='ac-slots'>
						{date && available.length > 0 ? (
							<div id='ac-slots-wrap'>{slots}</div>
						) : availableMonth.length === 0 ? (
							<div id='ac-slots-empty'>{dict.noAppointmentsAvailableMonth}</div>
						) : (
							<div id='ac-slots-empty'>{dict.noAppointmentsAvailable}</div>
						)}
						{refreshing && <Loader />}
					</div>
					{edit && selected && (
						<div id='ac-appointment'>
							{loadingAppointment ? (
								<Loader overlay={true} />
							) : (
								<React.Fragment>
									<div id='ac-appointment-details'>
										<div id='ac-appointment-details-date-wrap'>
											<div id='ac-appointment-details-date'>
												{moment(selected.startTime).tz('Parisƒ/Europe').format('HH:mm')} {dict.to}{' '}
												{moment(selected.endTime).tz('Europe/Paris').format('HH:mm')}
											</div>
											<div id='ac-appointment-details-time'>
												{moment.tz(selected.startTime, 'Europe/Paris').format('dddd MMM Do')}
											</div>
											<div id='ac-appointment-details-store'>
												{selected.store.name}, {selected.store.postalCode}
											</div>
										</div>
										{selected.appointment && selected.appointment.user ? (
											<div id='ac-appointment-details-wrap'>
												<div id='ac-appointment-details-name'>
													{selected.appointment.user.firstName} {selected.appointment.user.lastName}
												</div>

												<div id='ac-appointment-details-email'>{selected.appointment.user.email}</div>
												<div id='ac-appointment-details-phone'>{selected.appointment.user.phone}</div>
											</div>
										) : (
											<div id='ac-appointment-details-book'>
												<form id='ac-appointment-book-form' onSubmit={this.handleCustomerBooking}>
													<AsyncSelect
														onChange={this.handleCustomerSearchSelected}
														placeholder='Search customers...'
														loadOptions={this.handleCustomerSearch}
														cacheOptions
														value={customer}
														blurInputOnSelect={true}
													/>
													<Button loading={booking} disabled={customer ? false : true}>
														BOOK
													</Button>
												</form>
											</div>
										)}
									</div>

									<div id='ac-appointment-buttons'>
										{selected.appointment ? (
											<React.Fragment>
												<Button loading={cancelling} onClick={() => this.handleCancelAppointment(selected.appointment)}>
													CANCEL
												</Button>
												<Button loading={saving} onClick={() => this.handleDeleteAppointment(selected.appointment._id)}>
													DELETE
												</Button>
												{
													<a href={'tel:' + (selected.appointment.user ? selected.appointment.user.phone : '')}>
														<Button
															disabled={selected.appointment.user && selected.appointment.user.phone ? false : true}
														>
															CALL
														</Button>
													</a>
												}
												<a href={'mailto:' + selected.appointment.email}>
													<Button>E-MAIL</Button>
												</a>
											</React.Fragment>
										) : (
											<React.Fragment>
												<Button loading={saving} onClick={() => this.handleToggleAvailability(selected)}>
													{selected.generated ? 'ACTIVATE' : 'DE-ACTIVATE'}
												</Button>
											</React.Fragment>
										)}
									</div>
								</React.Fragment>
							)}
						</div>
					)}
				</div>
			</div>
		);
	}
}

export default AppointmentCalendar;
