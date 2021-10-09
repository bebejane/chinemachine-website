import React, { Component } from 'react';
import './Update.css';
import verificationService from '../../services/verificationService';
import Loader from '../util/Loader';
import Button from '../util/Button';

class Update extends Component {
	constructor(props) {
		super(props);
		this.state = {
			token: props.token,
			loading: false,
			updating: false,
			success: false,
			error: undefined,
			user: undefined,
			form: {
				newpassword: '',
				newpassword2: '',
				token: props.token,
			},
		};

		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleFormChange = this.handleFormChange.bind(this);
	}
	async componentDidMount() {}
	handleFormChange(e) {
		const form = this.state.form;
		form[e.target.id] = e.target.value;
		this.setState({ form });
	}
	async handleSubmit(e) {
		e.preventDefault();
		const { form } = this.state;
		if (form.newpassword !== form.newpassword2) return this.props.onError({ message: 'Password does not match' });

		this.setState({ error: undefined, updating: true, success: false });
		try {
			this.props.onSubmit();
			await verificationService.updatePassword(form.token, form.newpassword, form.newpassword2);
			setTimeout(() => this.setState({ updating: false, success: true }), 500);
		} catch (err) {
			this.setState({ updating: false, success: false });
			this.props.onError(err);
		}
	}
	render() {
		const { form, loading, success, updating } = this.state;

		const { dict } = this.props;

		return (
			<React.Fragment>
				{!success ? (
					<form onSubmit={this.handleSubmit}>
						<input
							id='newpassword'
							name='newpassword'
							autoFocus={true}
							placeholder={dict.newPassword + '...'}
							type='password'
							value={form.newpassword}
							onChange={this.handleFormChange}
						/>
						<input
							id='newpassword2'
							name='newpassword2'
							autoFocus={false}
							placeholder={dict.reType + ' ' + dict.newPassword + '...'}
							type='password'
							value={form.newpassword2}
							onChange={this.handleFormChange}
						/>
						<input id='token' name='token' type='hidden' value={form.token} onChange={this.handleFormChange} />
						<Button type='submit' loading={loading}>
							{dict.send}
						</Button>
					</form>
				) : (
					<React.Fragment>
						<div id='reset-password-message'>{dict.yourPasswordWasReset}</div>
					</React.Fragment>
				)}
				{updating && <Loader />}
				{loading && <Loader />}
			</React.Fragment>
		);
	}
}

export default Update;
