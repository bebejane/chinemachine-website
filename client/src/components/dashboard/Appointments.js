import React, { Component } from 'react';
import './Appointments.css';
import AppointmentCalendar from '../util/AppointmentCalendar';

class Appointments extends Component {
	constructor(props) {
		super(props);
		this.state = {
			appointment: undefined,
		};
	}
	componentDidMount() {}
	handleSelectAvailability(availability) {}
	render() {
		return (
			<div id='dash-appointments'>
				<div id='dash-appointments-calendar'>
					<AppointmentCalendar
						edit={true}
						langCode={'en'}
						onSelect={this.handleSelectAvailability}
						onError={(err) => this.props.onError(err)}
					/>
				</div>
			</div>
		);
	}
}

export default Appointments;
