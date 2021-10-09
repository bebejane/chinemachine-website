import React, { Component } from 'react';
import './Button.css';
import { RiLoader5Line } from 'react-icons/ri';

class Button extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}
	handleClick(e) {
		if (this.state.loading) return e.preventDefault();
		if (this.props.onClick) this.props.onClick(e);
	}
	render() {
		const { type, style, disabled, loading, value } = this.props;
		return (
			<button
				className={'button'}
				style={style || undefined}
				type={type}
				disabled={disabled || undefined}
				onClick={(e) => this.handleClick(e)}
			>
				{loading ? <RiLoader5Line className='button-loading' /> : this.props.children || value}
			</button>
		);
	}
}
export default Button;
