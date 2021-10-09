import React, { Component } from 'react';
import './index.css';

import Verification from '../verification';

class AppointmentVerification extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}
	async componentDidMount() {}
	render() {
		const { type } = this.props;
		return (
			<div id='appointment-verification'>
				<Verification type={type} noBackground={true} noLogo={true} onLogin={this.props.onLogin} />
			</div>
		);
	}
}
export default AppointmentVerification;
