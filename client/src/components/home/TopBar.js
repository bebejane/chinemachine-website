import React, { Component } from 'react';
import './TopBar.css';
import Chinemachine from './Chinemachine';
import ChinemachinePattern from './ChinemachinePattern';

class TopBar extends Component {
	constructor(props) {
		super(props);
		this.state = {
			langCode: props.langCode,
			user: undefined,
		};
	}
	componentDidMount() {}
	render() {
		const { dict } = this.props;
		return (
			<div id='top-bar'>
				<Chinemachine />
				<div id='buy-sell-trade-border-top'></div>
				<h1 id='buy-sell-trade'>{dict.header}</h1>
				<div id='buy-sell-trade-border-bottom'></div>
				<ChinemachinePattern />
			</div>
		);
	}
}

export default TopBar;
