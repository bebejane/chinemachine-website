import React, { Component } from 'react';
import './Login.css';
import verificationService from '../../services/verificationService';
import dictionaryService from '../../services/dictionaryService';
import Loader from '../util/Loader';
import Button from '../util/Button';

class Login extends Component {
	constructor(props) {
		super(props);
		this.state = {
			dict: {},
			redirect: props.redirect,
			loading: true,
			getUser: false,
			loggingIn: false,
			error: undefined,
			user: undefined,
			form: {
				email: '',
				password: '',
			},
		};

		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleFormChange = this.handleFormChange.bind(this);
		this.handleLogout = this.handleLogout.bind(this);
	}
	async componentDidMount() {
		this.setState({ loading: true });

		try {
			const dict = await dictionaryService.getDictionary('en');
			this.setState({ dict });
		} catch (err) {}

		try {
			const user = await verificationService.getUser();
			if (user) {
				console.log('user already logged in');
				this.setState({ getUser: true, user }, () => {
					this.handleLogin(user);
				});
			} else {
				console.log('user not logged in');
			}
		} catch (err) {
			this.setState({ getUser: false });
		}
		this.setState({ loading: false });
	}
	componentWillUnmount() {}
	async loadDictionary() {
		try {
			const dict = await dictionaryService.getDictionary('en');
			this.setState({ dict });
		} catch (err) {
			this.props.onError(err);
		}
	}

	handleFormChange(e) {
		const form = this.state.form;
		form[e.target.id] = e.target.value;
		this.setState({ form });
	}
	async handleSubmit(e) {
		e.preventDefault();
		const { form } = this.state;
		this.setState({ error: undefined, loggingIn: true });
		try {
			this.props.onSubmit();
			const user = await verificationService.login(form.email, form.password);
			setTimeout(() => {
				this.setState({ user, loggingIn: false, getUser: true }, () => this.handleLogin(user));
			}, 500);
		} catch (err) {
			this.setState({ loggingIn: false });
			this.props.onError(err);
		}
	}
	handleLogin(user) {
		if (this.props.onLogin) this.props.onLogin(user || this.state.user);
	}
	async handleLogout() {
		try {
			await verificationService.logout();
			this.setState({ getUser: false });
		} catch (err) {
			this.props.onError(err);
		}
	}
	render() {
		const { form, loading, loggingIn, getUser } = this.state;
		const { dict } = this.props;

		return (
			<React.Fragment>
				<form onSubmit={this.handleSubmit}>
					<input
						id='email'
						name='email'
						autoFocus={false}
						placeholder={dict.email + '...'}
						type='text'
						value={form.email}
						onChange={this.handleFormChange}
					/>
					<input
						id='password'
						name='password'
						placeholder={dict.password + '...'}
						type='password'
						value={form.password}
						onChange={this.handleFormChange}
					/>
					<Button className='button-wide' type='submit' loading={loggingIn}>
						Okey
					</Button>
				</form>
				{loggingIn && <Loader message={dict.loggingIn} />}
				{getUser && (
					<div id='login-loggedin'>
						<div id='login-loggedin-message'>{dict.youAreLoggedIn}</div>
					</div>
				)}
				{loading && <Loader />}
			</React.Fragment>
		);
	}
}

export default Login;
