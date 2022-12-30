import React, { Component } from "react";
import "./NoAppointments.css";

class NoAppointments extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		const { dict } = this.props;

		return (
			<div className={"noappointments"}>
				<div className={"noappointments-content"}>{dict.noAppointments}</div>
			</div>
		);
	}
}

export default NoAppointments;
