import React, { Component } from 'react';
import AppointmentBrowser from './AppointmentBrowser';
import ErplyBrowser from './ErplyBrowser';
import './HomeSection.css';

class HomeSection extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<div id='dash-home'>
				<ErplyBrowser onError={(err) => this.props.onError(err)} />
				<AppointmentBrowser onError={(err) => this.props.onError(err)} />
			</div>
		);
	}
}

export default HomeSection;
