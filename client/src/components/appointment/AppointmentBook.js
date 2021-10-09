import React, { Component } from 'react';
import './index.css';
import logo from '../../images/cm_logo_black_128px.png';
import moment from 'moment';

const formatAvailability = (availability, dict) => {
	return (
		<div>
			{moment(availability.startTime).format('dddd MMMM Do')}
			<br />
			{moment(availability.startTime).format('HH:mm')} {dict.to} {moment(availability.endTime).format('HH:mm')}
		</div>
	);
};
class AppointmentBook extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}
	async componentDidMount() {}
	render() {
		const { dict, selected, user } = this.props;

		const { store } = selected;

		return (
			<div id='appointment-book'>
				<div id='appointment-book-wrap'>
					<div id="appointment-your">Your appointment</div>
					<br/>
					<div id='appointment-book-time'>{formatAvailability(selected, dict)}</div>
					<div>@</div>
					<div>
						{store.name}
						<br />
						{store.address}
						<br />
						{store.postalCode}
					</div>
					<div>
						<img id={'appointment-logo'} src={logo} alt='Chinemachine' />
					</div>
					<div id='appointment-book-now'>{dict.bookThisAppointment}</div>
				</div>
			</div>
		);
	}
}
export default AppointmentBook;
