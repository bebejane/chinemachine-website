import React, { Component } from 'react';
import './Modal.css';
import Button from '../util/Button';

const buttonStyle = {
	backgroundColor: '#fff',
	color: '#000',
	border: '1px solid rgba(0,0,0,0.1)',
	flex: '0 0 auto',
};
class Modal extends Component {
	constructor(props) {
		super(props);
		this.state = {};

		this.onConfirm = this.onConfirm.bind(this);
		this.onCancel = this.onCancel.bind(this);
		this.onClose = this.onClose.bind(this);
	}
	onConfirm(e) {
		this.props.onConfirm(e);
	}
	onCancel(e) {
		if (this.props.onCancel) this.props.onCancel(e);
	}
	onClose(e) {
		this.props.onClose(e);
	}
	render() {
		const { header, message, confirm, cancel, styles, error } = this.props;

		return (
			<div className={'dash-modal'} style={styles}>
				<div className={'dash-modal-wrap'}>
					<div className={error ? 'dash-modal-header-error' : 'dash-modal-header'}>{error ? 'Error' : header}</div>
					<div className='dash-modal-content'>
						<div className={error ? 'dash-modal-message-error' : 'dash-modal-message'}>{error || message}</div>
					</div>
					<div className='dash-modal-bottom'>
						<div className='dash-modal-buttons'>
							{!error ? (
								<React.Fragment>
									<Button onClick={this.onConfirm}>{confirm || 'OK'}</Button>
									<Button onClick={this.onCancel}>{cancel || 'CANCEL'}</Button>
								</React.Fragment>
							) : (
								<Button style={buttonStyle} onClick={this.onCancel}>
									{cancel || 'CLOSE'}
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}
}
export default Modal;
