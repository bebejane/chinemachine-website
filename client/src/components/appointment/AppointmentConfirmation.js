import React, { Component } from 'react';
import './index.css';
import moment from 'moment';

const formatAvailability = (availability, dict) => {
	moment.locale(dict._langCode);
	return (
		<div>
			{moment(availability.startTime).format('dddd MMMM Do')}
			<br />
			{moment(availability.startTime).format('HH:mm')} {dict.to} {moment(availability.endTime).format('HH:mm')}
		</div>
	);
};
class AppointmentConfirmation extends Component {
	render() {
		const { dict, appointment } = this.props;

		return (
			<div id='appointment-finished'>
				<div id='appointment-confirmation'>
					<div id='appointment-form-time'>
						<span id='appointment-confirmation-thanks'>{dict.thanksBooking}</span>
						<br />
						<span id='appointment-confirmation-bookedfor'>{dict.appointmentBookedFor}</span>
						<br />
						<br />
						{formatAvailability(appointment, dict)}
					</div>
					<div id='appointment-form-store'>
						@<br />
						{appointment.store.name}
						<br />
						{appointment.store.address}
						<br />
						{appointment.store.postalCode}
					</div>
					<div id='appointment-goto-account'>
						<p>
							{dict.gotoAccount} <a href='/account'>account</a>
						</p>
					</div>
				</div>
			</div>
		);
	}
}
export default AppointmentConfirmation;
