import React, { Component } from 'react';
import './Verify.css';
import verificationService from '../../services/verificationService';
import dictionaryService from '../../services/dictionaryService';
import Loader from '../util/Loader';
import Button from '../util/Button';

class Verify extends Component {
	constructor(props) {
		super(props);
		this.state = {
			dict: {},
			token: props.token,
			verified: false,
			verifying: false,
			loading: false,
			error: undefined,
			form: {
				code: '',
				token: props.token || '',
			},
		};
		this.formRef = React.createRef();
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleFormChange = this.handleFormChange.bind(this);
	}
	async componentDidMount() {
		await this.loadDictionary();
		const { token } = this.state;
		if (token) this.handleSubmit();
	}
	async loadDictionary() {
		try {
			const dict = await dictionaryService.getDictionary();
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
			this.setState({ verifying: true, verified: false, error: undefined });
			this.props.onSubmit();
			await verificationService.verify(form.token || form.code);
			this.setState({ verified: true, verifying: false });
		} catch (err) {
			this.props.onError(err);
			this.setState({ verifying: false, verified: false, error: err });
		}
	}

	render() {
		const { form, verifying, verified, error, user } = this.state;

		const { dict } = this.props;

		if (verifying) return <Loader message={'verifying account'} />;

		return (
			<React.Fragment>
				{!error && verified && (
					<div id='verify-finished-message'>
						{dict.accountIsVerified}
						<br />
						<div id={'verify-finished-gotologin'}>
							<Button onClick={() => this.props.onVerification(user)}>{dict.login}</Button>
						</div>
					</div>
				)}
				{!verified && (
					<React.Fragment>
						<div id='verify-finished-message'>{dict.checkEmailToVerifyAccount}</div>
						<form ref={this.formRef} onSubmit={this.handleSubmit}>
							<input
								id='code'
								autoComplete='off'
								autoFocus={false}
								value={form.code}
								placeholder={dict.securityCode + '...'}
								name='code'
								type='number'
								onChange={this.handleFormChange}
							/>
							<input id='token' name='token' type='hidden' value={form.token} onChange={this.handleFormChange} />
							<Button type='submit' loading={verifying}>
								Okey
							</Button>
						</form>
					</React.Fragment>
				)}
			</React.Fragment>
		);
	}
}

export default Verify;
