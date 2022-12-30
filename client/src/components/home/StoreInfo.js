import React, { Component } from "react";
import { Link } from "react-router-dom";
import Button from "../util/Button";
import "./StoreInfo.css";
import moment from "moment";
import etsyLogo from "../../images/etsy-logo.png";
import depopLogo from "../../images/depop-logo.png";

import {
	PHONE,
	EMAIL,
	INSTAGRAM_URL,
	INSTAGRAM_APP_URL,
	FACEBOOK_URL,
	FACEBOOK_APP_URL,
} from "../../constants";

import Loader from "../util/Loader";

import storeService from "../../services/storeService";

const formatHours = (hours) => {
	const ranges = [];

	for (var i = 0, start: -1, end: -1; i < hours.length; i++) {
		if (!hours[i].start || !hours[i].end) continue;
		if (start !== hours[i].start || end !== hours[i].end) {
			ranges.push({ start: hours[i].start, end: hours[i].end, from: hours[i].name });
			start = hours[i].start;
			end = hours[i].end;
		} else ranges[ranges.length - 1].to = hours[i].name;
	}
	return ranges.map((range, idx) => (
		<div key={"range-" + idx} className="store-info-hour-wrap">
			{range.from && range.to ? range.from + " to " + range.to : range.from}
			<br />
			{moment().startOf("day").add("minutes", range.start).format("HH:mm")} -{" "}
			{moment().startOf("day").add("minutes", range.end).format("HH:mm")}
		</div>
	));
};

class StoreInfo extends Component {
	constructor(props) {
		super(props);
		this.state = {
			stores: [],
			error: undefined,
		};
	}
	componentDidMount() {
		this.loadStores();
	}
	async loadStores() {
		this.setState({ loading: true });
		try {
			const stores = await storeService.getAll();
			this.setState({ stores });
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ loading: false });
	}
	handleError(err) {
		//this.props.onError(err)
		console.log(err);
	}
	render() {
		const { stores, loading } = this.state;
		const { dict, langCode } = this.props;

		return (
			<React.Fragment>
				<div id="store-info">
					<div id="store-info-left">
						<div>
							<h3>{dict.ourStores}</h3>
						</div>
						<div className="store-info-details-wrap">
							{stores.map((store, idx) => (
								<div key={"store" + idx} className="store-info-details">
									<div className="store-info-address">{store.address}</div>
									<div className="store-info-city">
										{store.city} {store.postalCode}
									</div>
									<div className="store-info-phone">
										<a href={"tel:" + store.phone}>{store.phone}</a>
									</div>
									<div className="store-info-openning-hours">{formatHours(store.openingHours)}</div>
									{store.status && <div className="store-info-status">{store.status}</div>}
								</div>
							))}
						</div>
					</div>
					<div id="store-info-right">
						<div id="store-info-right-top">
							<div>
								<h3>{dict.sellingHours}</h3>
							</div>
							{stores.map((store, idx) => (
								<div key={"store-selling" + idx} className="store-info-selling-hour">
									{store.address}
									<br />
									{formatHours(store.sellingHours)}
								</div>
							))}
							<div id="store-info-by-appointment">{dict.byAppointmentOnly}</div>
							<Link id="store-info-appointment-button" to={{ pathname: "/appointment", langCode }}>
								{dict.bookNow}
							</Link>
						</div>
					</div>
					{loading && <Loader invert={true} />}
				</div>
				<div id="store-info-bottom">
					<div id="store-info-onlinestores">
						<a href="https://www.etsy.com/shop/Chinemachine">
							<img src={etsyLogo} />
						</a>
						<a href="https://www.depop.com/chinemachine">
							<img src={depopLogo} />
						</a>
					</div>
					<div id="store-info-social">
						<a href={INSTAGRAM_URL} className="app-link" app-url={INSTAGRAM_APP_URL}>
							<div id="i_ig" className="icon"></div>
						</a>
						<a href={FACEBOOK_URL} className="app-link" app-url={FACEBOOK_APP_URL}>
							<div id="i_fb" className="icon"></div>
						</a>
						<a href={"mailto:" + EMAIL} className="app-link">
							<div id="i_em" className="icon"></div>
						</a>
						<a href={"tel:" + PHONE} className="app-link">
							<div id="i_ph" className="icon"></div>
						</a>
					</div>
				</div>
				<div id="store-info-borders">
					<div id="store-info-border-top"></div>
				</div>
			</React.Fragment>
		);
	}
}

export default StoreInfo;
