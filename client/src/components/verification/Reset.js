import React, { Component } from 'react';
import './Reset.css';
import verificationService from '../../services/verificationService';
import Loader from '../util/Loader';
import Button from '../util/Button';

class Reset extends Component {
	constructor(props) {
		super(props);
		this.state = {
			dict: {},
			loading: true,
			resetting: false,
			success: false,
			error: undefined,
			user: undefined,
			form: {
				email: '',
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
		this.setState({ error: undefined, resetting: true, success: false });
		try {
			this.props.onSubmit();
			await verificationService.requestPasswordReset(form.email);
			setTimeout(() => this.setState({ resetting: false, success: true }), 500);
		} catch (err) {
			this.setState({ resetting: false, success: false });
			this.props.onError(err);
		}
	}
	render() {
		const { form, success, resetting } = this.state;
		const { dict } = this.props;

		return (
			<React.Fragment>
				<form onSubmit={this.handleSubmit}>
					{!success ? (
						<React.Fragment>
							<div id='reset-password-message'>{dict.fillInEmailPasswordReset}</div>
							<input
								id='email'
								name='email'
								autoFocus={true}
								placeholder={dict.email + '...'}
								type='text'
								value={form.email}
								onChange={this.handleFormChange}
							/>
							<Button type='submit' loading={resetting}>
								Okey
							</Button>
						</React.Fragment>
					) : (
						<div id='reset-password-message-done'>{dict.checkEmailForPasswordResetLink}</div>
					)}
				</form>
				{resetting && <Loader />}
			</React.Fragment>
		);
	}
}

export default Reset;
