import React, { Component } from 'react';
import './Signup.css';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import verificationService from '../../services/verificationService';
import dictionaryService from '../../services/dictionaryService';
import Loader from '../util/Loader';
import Button from '../util/Button';

class Signup extends Component {
	constructor(props) {
		super(props);
		this.state = {
			dict: {},
			isSignedUp: false,
			loading: false,
			signingUp: false,
			error: undefined,
			token: props.token,
			form: {
				firstName: '',
				lastName: '',
				email: '',
				email2: '',
				phone: '',
				password: '',
				password2: '',
			},
		};
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleFormChange = this.handleFormChange.bind(this);
	}
	componentDidMount() {
		this.loadDictionary();
	}
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
	handlePhoneChange(value) {
		const form = this.state.form;
		form.phone = value;
		this.setState({ form });
	}
	async handleSubmit(e) {
		console.log('saving signup');
		e.preventDefault();
		const { form } = this.state;
		this.setState({ signingUp: true, error: undefined });
		try {
			console.log('signing up no...');
			this.props.onSubmit();
			const user = await verificationService.signup(form);
			console.log('SIGNED UP');
			this.setState({ user }, () => this.handleSignUp(user));
		} catch (err) {
			console.log('was errors');
			this.props.onError(err);
		}
		setTimeout(() => {
			this.setState({ signingUp: false });
		}, 300);
	}
	handleSignUp(user) {
		console.log('signed up', user);
		if (!user) return this.props.onError('User signed in is empty');

		this.setState({ isSignedUp: true, user, error: undefined });
		if (this.props.onSignUp) this.props.onSignUp(user);
	}
	render() {
		const { form, signingUp, error } = this.state;
		const { dict } = this.props;
		return (
			<React.Fragment>
				<form onSubmit={this.handleSubmit}>
					<input
						id='firstName'
						value={form.firstName}
						onChange={this.handleFormChange}
						autoComplete='off'
						placeholder={dict.firstName + '...'}
						name='firstName'
						type='text'
					/>
					<input
						id='lastName'
						value={form.lastName}
						onChange={this.handleFormChange}
						autoComplete='off'
						placeholder={dict.lastName + '...'}
						name='firstName'
						type='text'
					/>
					<input
						id='email'
						value={form.email}
						onChange={this.handleFormChange}
						autoComplete='off'
						placeholder={dict.email + '...'}
						name='email'
						type='text'
					/>
					<input
						id='email2'
						value={form.email2}
						onChange={this.handleFormChange}
						autoComplete='off'
						placeholder={dict.reType + ' ' + dict.email + '...'}
						name='email2'
						type='text'
					/>
					<input
						id='password'
						value={form.password}
						onChange={this.handleFormChange}
						autoComplete='off'
						placeholder={dict.password + '...'}
						name='password'
						type='password'
					/>
					<input
						id='password2'
						value={form.password2}
						onChange={this.handleFormChange}
						autoComplete='off'
						placeholder={dict.reType + ' ' + dict.password + '...'}
						name='password'
						type='password'
					/>
					<PhoneInput
						placeholder={dict.phone + '...'}
						value={form.phone}
						defaultCountry={'FR'}
						onChange={(val) => this.handlePhoneChange(val)}
					/>
					<Button type='submit' loading={signingUp}>
						Okey
					</Button>
				</form>
				{signingUp && <Loader message={dict.signingUp} />}
				{error && <div id='signup-error'>{error}</div>}
			</React.Fragment>
		);
	}
}

export default Signup;
