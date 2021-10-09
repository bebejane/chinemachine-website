import React, { Component } from 'react';
import './index.css';
import dictionaryService from '../../services/dictionaryService';
import Loader from '../util/Loader';
import Container from './Container';
import Login from './Login';
import Logout from './Logout';
import Signup from './Signup';
import Reset from './Reset';
import Update from './Update';
import Verify from './Verify';
import ReCode from './ReCode';

class Verification extends Component {
	constructor(props) {
		super(props);
		const searchParams = new URLSearchParams(props.location ? props.location.search : '');
		const type =
			props.location && props.location.pathname.replace('/verification', '')
				? props.location.pathname.replace('/verification/', '')
				: props.type || 'login';

		this.state = {
			loading: false,
			type: type,
			dict: {},
			noBackground: props.noBackground,
			error: searchParams.get('error') || undefined,
			redirect: searchParams.get('redirect'),
			token: searchParams.get('token'),
			types: {
				login: 'Login',
				logout: 'Log out',
				signup: 'Sign Up',
				verify: 'Verify',
				reset: 'Reset password',
				update: 'Change password',
				recode: 'Verify account',
			},
		};

		this.handleLogin = this.handleLogin.bind(this);
		this.handleLogout = this.handleLogout.bind(this);
		this.handleSignUp = this.handleSignUp.bind(this);
	}
	componentDidMount() {
		this.loadDictionary();
	}
	async loadDictionary() {
		const dict = await dictionaryService.getDictionary();
		const types = {
			login: dict.login,
			logout: dict.logout,
			signup: dict.signup,
			verify: dict.verify,
			reset: dict.resetPassword,
			update: dict.changePassword,
			recode: dict.verifyAccount,
		};
		this.setState({ dict, types });
	}
	handleSubmit() {
		this.setState({ error: undefined });
	}
	handleError(err) {
		const error = !err
			? undefined
			: err.response && err.response.data
			? err.response.data.message
			: err.message || err.toString();
		this.setState({ error });
	}
	handleShowType(type, user) {
		console.log(type, user);
		this.setState({ type, user, error: undefined }, () => {
			document.title = 'Chinemachine / ' + this.state.types[this.state.type];
		});
	}
	handleShowLogin(user) {
		this.setState({ component: Login, user });
	}
	handleLogin(user) {
		this.setState({ user, error: undefined });
		if (this.props.onLogin) this.props.onLogin(user);
		this.redirect();
		console.log('logged in');
	}
	handleLogout() {
		this.setState({ user: null, type: 'login', error: undefined });
		if (this.props.onLogout) this.props.onLogout();
		this.redirect();
		console.log('logged out');
	}
	handleSignUp(user) {
		console.log('NEW SIGNUP', user);
		this.setState({ user, error: undefined });
		if (this.props.onSignUp) this.props.onSignUp();
		this.handleShowType('verify');
		console.log('signed up');
	}
	handleVerification(user) {
		console.log('verified account');
		this.setState({ error: undefined });
		if (this.props.onVerification) this.props.onVerification();
		this.handleShowType('login');
	}

	handleUpdated(user) {
		console.log(user);
		this.handleShowType('login');
	}
	redirect() {
		console.log('REDIRECT', this.state.redirect);
		//return
		if (this.state.redirect) this.props.history.push(this.state.redirect);
	}
	render() {
		const { user, type, types, loading, redirect, noBackground, token, dict, error } = this.state;

		const { noLogo } = this.props;

		return (
			<div id='verification' style={noBackground ? { background: 'none' } : undefined}>
				<Container
					header={types[type]}
					type={type}
					error={error}
					noLogo={noLogo}
					dict={dict}
					onChange={(type) => this.handleShowType(type)}
				>
					{type === 'login' ? (
						<Login
							key={'login'}
							email={user && user.email}
							onLogin={this.handleLogin}
							redirect={redirect}
							dict={dict}
							onError={(err) => this.handleError(err)}
							onSubmit={() => this.handleSubmit()}
						/>
					) : type === 'logout' ? (
						<Logout
							key={'logout'}
							email={user && user.email}
							onLogout={this.handleLogout}
							redirect={redirect}
							dict={dict}
							onError={(err) => this.handleError(err)}
							onSubmit={() => this.handleSubmit()}
						/>
					) : type === 'reset' ? (
						<Reset
							key={'reset'}
							email={user && user.email}
							token={token}
							dict={dict}
							onError={(err) => this.handleError(err)}
							onSubmit={() => this.handleSubmit()}
						/>
					) : type === 'update' ? (
						<Update
							key={'update'}
							email={user && user.email}
							token={token}
							dict={dict}
							onUpdated={() => this.handleUpdated()}
							onError={(err) => this.handleError(err)}
							onSubmit={() => this.handleSubmit()}
						/>
					) : type === 'verify' ? (
						<Verify
							key={'update'}
							token={token}
							dict={dict}
							onVerification={(user) => this.handleVerification(user)}
							onError={(err) => this.handleError(err)}
							onSubmit={() => this.handleSubmit()}
						/>
					) : type === 'recode' ? (
						<ReCode
							key={'recode'}
							dict={dict}
							onReCode={() => this.handleShowType('verify')}
							onError={(err) => this.handleError(err)}
							onSubmit={() => this.handleSubmit()}
						/>
					) : type === 'signup' ? (
						<Signup
							key={'signup'}
							dict={dict}
							onSignUp={this.handleSignUp}
							redirect={redirect}
							onError={(err) => this.handleError(err)}
							onSubmit={() => this.handleSubmit()}
						/>
					) : (
						<div>Invalid type</div>
					)}
					{loading && <Loader />}
				</Container>
				<div id='verification-bubbles'>
					<div className='verification-bubble' onClick={() => this.handleShowType('reset')}>
						{dict.forgotPassword}
					</div>
					<div className='verification-bubble' onClick={() => this.handleShowType('recode')}>
						{dict.verifyAccount}
					</div>
				</div>
			</div>
		);
	}
}

export default Verification;
