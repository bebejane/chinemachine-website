import React, { Component } from 'react';
import logo from '../../images/cmgold_small.png';
import './Chinemachine.css';

class Chinemachine extends Component {
	constructor(props) {
		super(props);
		this.state = {
			langCode: props.langCode,
			click: false,
			clicks: 0,
		};
		this.logoRef = React.createRef();
		this.handleClick = this.handleClick.bind(this);
	}
	onComponentDidMount() {
		console.log(this.logoRef.target);
	}
	handleClick(e) {
		let { clicks } = this.state;
		this.setState({ click: true, clicks: clicks > 9 ? 0 : ++clicks });
		setTimeout(() => this.setState({ click: false }), 2000);
	}
	render() {
		const { click, clicks } = this.state;
		const imageStyle = {
			filter: 'grayscale(' + clicks * 10 + '%)',
		};
		return (
			<div id='chinemachine-wrap' onClick={this.handleClick}>
				<img
					ref={this.logoRef}
					alt='Chinemachine'
					style={imageStyle}
					key={new Date().getTime()}
					className={click ? 'cm-punch' : 'chinemachine'}
					src={logo}
				/>
			</div>
		);
	}
}

export default Chinemachine;
