import React, { Component } from 'react';
import logoPattern from '../../images/cm_pattern.png';
import './ChinemachinePattern.css';

class ChinemachinePattern extends Component {
	constructor(props) {
		super(props);
		this.state = {};
		this.logoRef = React.createRef();
		this.handleClick = this.handleClick.bind(this);
	}
	onComponentDidMount() {
		console.log('pattern');
	}
	handleClick(e) {}
	render() {
		return (
			<React.Fragment>
				<div id='chinemachine-pattern'></div>
				<img id='chinemachine-pattern-fixed' src={logoPattern} alt='' />
			</React.Fragment>
		);
	}
}

export default ChinemachinePattern;
