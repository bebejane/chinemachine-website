import React, { Component } from 'react';
import './index.css';
import AppointmentCalendar from '../util/AppointmentCalendar';

class AppointmentDate extends Component {
	constructor(props) {
		super(props);
		this.state = {
			...props,
		};
	}
	componentDidMount() {}
	static getDerivedStateFromProps(nextProps, prevState) {
		return nextProps;
	}

	render() {
		const { dict, langCode, date, selected } = this.state;

		return (
			<div id='appointment-select'>
				<div id='appointment-calendar'>
					<AppointmentCalendar
						key='appointment-calendar'
						dict={dict}
						langCode={langCode}
						edit={false}
						date={date}
						selected={selected}
						onChange={this.props.onDateChange}
						onSelect={this.props.onSelectAvailable}
					/>
				</div>
			</div>
		);
	}
}
export default AppointmentDate;
