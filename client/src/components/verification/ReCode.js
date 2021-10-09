import React, { Component } from 'react';
import './ReCode.css';
import verificationService from '../../services/verificationService';
import dictionaryService from '../../services/dictionaryService';
import Loader from '../util/Loader';
import Button from '../util/Button';

class ReCode extends Component {
	constructor(props) {
		super(props);
		this.state = {
			dict: {},
			token: props.token,
			resent: false,
			resending: false,
			loading: false,
			error: undefined,
			form: {
				email: '',
			},
		};
		this.formRef = React.createRef();
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleFormChange = this.handleFormChange.bind(this);
	}
	async componentDidMount() {
		await this.loadDictionary();
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
	async handleSubmit(e) {
		console.log('verifying signup');
		if (e) e.preventDefault();

		const { form } = this.state;
		try {
			this.props.onSubmit();
			this.setState({ resending: true, resent: false, error: undefined });
			await verificationService.reverify(form.email);
			this.setState({ resending: false, resent: true });
			this.props.onReCode();
		} catch (err) {
			this.setState({ resending: false });
			this.props.onError(err);
		}
	}

	render() {
		const { form, resent, resending, user } = this.state;
		const { dict } = this.props;
		//if(loading) return <Loader/>

		return (
			<React.Fragment>
				<div id='recode-enter-email'>{dict.enterEmailForCode}</div>
				{resent ? (
					<div id='recode-finished-message'>
						{dict.accountIsVerified}
						<br />
						<Button id={'recode-finished-gotologin'} onClick={() => this.props.onVerification(user)}>
							{dict.login}
						</Button>
					</div>
				) : (
					<form ref={this.formRef} onSubmit={this.handleSubmit}>
						<input
							id='email'
							autoComplete='off'
							autoFocus={false}
							value={form.email}
							placeholder={dict.email + '...'}
							name='email'
							type='text'
							onChange={this.handleFormChange}
						/>
						<Button type='submit' loading={resending}>
							Okey
						</Button>
					</form>
				)}
				{resending && <Loader message={dict.reSendingVerificationCode} />}
			</React.Fragment>
		);
	}
}

export default ReCode;
