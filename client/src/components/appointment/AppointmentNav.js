import React, { Component } from 'react';
import './index.css';
import Button from '../util/Button';
import moment from 'moment';

class AppointmentNav extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}
	async componentDidMount() {}
	render() {
		const { selected, dict, prev, book, next } = this.props;

		return (
			<div id='appointment-bottom'>
				{!book && selected && (
					<div id='appointment-booking-time'>
						<div id='appointment-booking-time-header'>
							<div id='appointment-booking-time-date'>
								{moment(selected.startTime).format('dddd MMMM Do')}
								<br />
								{moment(selected.startTime).format('HH:mm')} to {moment(selected.endTime).format('HH:mm')}
							</div>
						</div>
					</div>
				)}
				{selected && (
					<div id='appointment-bottom-buttons'>
						<Button className={'appointment-button'} onClick={() => this.props.onPrev()} disabled={!prev}>
							{dict.back}
						</Button>
						{next !== undefined && (
							<Button className={'appointment-button'} onClick={() => this.props.onNext()} disabled={!next}>
								{dict.next}
							</Button>
						)}
						{book && (
							<Button
								style={{ backgroundColor: 'rgb(5, 155, 29)', color: '#fff' }}
								onClick={() => this.props.onBookAppointment()}
								disabled={false}
							>
								{dict.confirm}
							</Button>
						)}
					</div>
				)}
			</div>
		);
	}
}
export default AppointmentNav;
