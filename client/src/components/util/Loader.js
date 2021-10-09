import React, { Component } from 'react';
import './Loader.css';
import { MdRefresh } from 'react-icons/md';
import { RiLoader5Line } from 'react-icons/ri';

import logo from '../../images/cm_logo_black_128px.png';
import logoWhite from '../../images/cm_logo_white_128px.png';

class Loader extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}
	onRetry() {
		if (this.props.onRetry) this.props.onRetry();
	}
	render() {
		const { message, error, styles, overlay, invert, type } = this.props;

		return (
			<div className={invert ? 'loader-invert' : overlay ? 'loader-overlay' : 'loader'} style={styles}>
				<div className={overlay ? 'loader-content-overlay' : 'loader-content'}>
					{error ? (
						<div className='loader-error'>
							<div className='loader-error-message'>{error}</div>
							<div className='loader-retry'>
								<MdRefresh onClick={() => this.onRetry()} />
							</div>
						</div>
					) : (
						<div className='loader-message-wrap'>
							{message && <div className='loader-message'>{message}</div>}
							<div className='loader-spinner'>
								{type === 'fast' ? (
									<RiLoader5Line className='loader-spinner-fast' />
								) : (
									<img
										alt=''
										className={overlay ? 'loader-spinner-image-overlay' : 'loader-spinner-image'}
										src={invert ? logoWhite : logo}
									/>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}
}

export default Loader;
