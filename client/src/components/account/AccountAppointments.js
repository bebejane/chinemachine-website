import React, { Component } from 'react';
import Loader from '../util/Loader';

class AccountAppointments extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}
	async componentDidMount() {}

	render() {
		const { loading, error } = this.state;

		if (loading)
			return <Loader error={error} onRetry={() => this.componentDidMount()} />;

		return <div id='account-appointments'>acount appointments</div>;
	}
}

export default AccountAppointments;
