import React, { Component } from 'react';
import './Container.css';
import logo from '../../images/cm_logo_white_128px.png';
import verificationService from '../../services/verificationService';
import dictionaryService from '../../services/dictionaryService';
import Loader from '../util/Loader';

class Container extends Component {
	constructor(props) {
		super(props);
		this.state = {
			dict: {},
			redirect: props.redirect,
			loading: true,
			error: undefined,
			form: {},
		};
	}
	async componentDidMount() {
		this.setState({ loading: true });

		try {
			const dict = await dictionaryService.getDictionary('en');
			this.setState({ dict });
		} catch (err) {}

		try {
			const user = await verificationService.getUser();

			if (user) this.setState({ user });
			else console.log('user not logged in');
		} catch (err) {
			this.setState({ getUser: false });
		}
		this.setState({ loading: false });
	}
	async loadDictionary() {
		try {
			const dict = await dictionaryService.getDictionary('en');
			this.setState({ dict });
		} catch (err) {
			this.props.onError(err);
		}
	}
	async handleLogout() {
		try {
			await verificationService.logout();
			this.props.onChange('login');
			this.setState({ user: undefined });
		} catch (err) {
			this.props.onError(err);
		}
	}
	render() {
		const { loading } = this.state;
		const { header, children, type, error, noLogo, dict } = this.props;
		const nav =
			type !== 'login' ? (
				<div id='container-logout' onClick={() => this.props.onChange('login')}>
					{dict.login}
				</div>
			) : (
				<div id='container-signup' onClick={() => this.props.onChange('signup')}>
					{dict.signup}
				</div>
			);

		if (loading) return <Loader />;

		return (
			<div id='container-wrapper'>
				<div id='container-top'>
					<div id='container-spacer'></div>
					{nav}
				</div>
				<div id='container-header-border'></div>
				<div id='container-header'>
					{header}
					<div id='container-header-logo-wrap'>
						{!noLogo && (
							<a href='/'>
								<img alt='Chinemachine' src={logo} id='container-header-logo' />
							</a>
						)}
					</div>
				</div>
				<div id='container-content'>{children}</div>
				{error && <div id='container-error'>{error}</div>}
				{loading && <Loader />}
			</div>
		);
	}
}

export default Container;
