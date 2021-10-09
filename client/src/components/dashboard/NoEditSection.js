import React, { Component } from 'react';
import './NoEditSection.css';

class NoEditSection extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return <div id='dash-empty'>You cant edit this section</div>;
	}
}

export default NoEditSection;
