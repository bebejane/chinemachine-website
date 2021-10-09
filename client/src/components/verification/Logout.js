import React, { Component } from 'react';
import './Logout.css';
import verificationService from '../../services/verificationService';
import Loader from '../util/Loader';

class Logout extends Component {
	constructor(props) {
		super(props);
		this.state = {
			loading: true,
			error: undefined,
		};
	}
	async componentDidMount() {
		try {
			this.props.onSubmit();
			await verificationService.logout();
			this.setState({ loading: false });
			this.props.onLogout();
		} catch (err) {
			this.props.onError(err);
		}
	}
	render() {
		const { loading } = this.state;
		const { dict } = this.props;
		if (loading) return <Loader message={dict.loggingOut + '...'} />;
		return <div>{dict.youAreLoggedIn}</div>;
	}
}

export default Logout;
