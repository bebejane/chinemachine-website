import React, { Component } from 'react';

class Instagram extends Component {
	constructor(props) {
		super(props);
		this.state = {
			lang: props.lang,
		};
	}

	render() {
		return <div>Insta</div>;
	}
}

export default Instagram;
