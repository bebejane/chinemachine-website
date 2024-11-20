import React, { Component } from "react";
import "./AppointmentBrowser.css";
import Loader from "../util/Loader";
import * as moment from "moment-timezone";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { IoIosRefresh } from "react-icons/io";
import appointmentService from "../../services/appointmentService";

//moment.tz.add('Europe/Paris')

const formatWeekRange = (date) => {
	const startDate = moment(date).isoWeekday(1);
	return startDate.format("MMM Do") + " - " + startDate.day(7).format("MMM Do");
};
const capitalize = (str, lower = true) => {
	return (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) =>
		match.toUpperCase()
	);
};
const isCurrentTimeSlot = (appointment) => {
	const now = moment().tz("Europe/Paris");
	const startDate = moment.tz(appointment.startTime, "Europe/Paris");
	const endDate = moment.tz(appointment.endTime, "Europe/Paris");
	return now.isBetween(startDate, endDate);
};
class AppointmentBrowser extends Component {
	constructor(props) {
		super(props);
		this.state = {
			month: [],
			week: [],
			days: [],
			date: new Date(),
			loading: false,
			current: undefined,
		};
		this.checkCurrentTimeSlotInterval = null;
	}
	componentDidMount() {
		this.loadAppointments();

		this.checkCurrentTimeSlotInterval = setInterval(() => {
			const { week, current } = this.state;
			const newCurrent = week.filter((app) => isCurrentTimeSlot(app))[0];
			if (newCurrent && newCurrent._id !== current._id) this.setState({ current: newCurrent });
		}, 5000);
	}
	componentWillUnmount() {
		clearInterval(this.checkCurrentTimeSlotInterval);
		// fix Warning: Can't perform a React state update on an unmounted component
		this.setState = (state, callback) => {
			return;
		};
	}
	handleBrowse(ffw) {
		const date = this.state.date;
		const newDate = (
			ffw ? moment(date).add(1, "weeks") : moment(date).subtract(1, "weeks")
		).toDate();
		this.loadAppointments(newDate);
	}
	async loadAppointments(date) {
		date = new Date(date || this.state.date);

		this.setState({ loading: true });
		try {
			const now = moment(date);
			let week = await appointmentService.getAllByWeek(now.year(), now.isoWeek());
			week = week.filter(
				(ap) => ap.userId && ap.user && (ap.status === "BOOKED" || ap.status === "CANCELLED")
			);

			const days = new Array(7)
				.fill(0)
				.map((wd, idx) => {
					const appointments = week.filter((app) => moment(app.startTime).day() === idx);
					const date = now.day(idx).toDate();
					return { appointments, date };
				})
				.filter((d) => d.appointments.length)
				.sort((a, b) => a.date > b.date);

			const current = week.filter((app) => isCurrentTimeSlot(app))[0];
			this.setState({ week, days, date, current });
		} catch (error) {
			this.setState({ error });
			this.props.onError(error);
		}
		this.setState({ loading: false });
	}

	render() {
		const { days, date, current, loading } = this.state;

		return (
			<div id="dash-appointments-week">
				<div id="dash-appointment-week-header">Appointments</div>
				<div id="dash-appointment-browser">
					<div id="dash-appointment-back" onClick={() => this.handleBrowse(false)}>
						<BsChevronLeft />
					</div>
					<div id="dash-erply-refresh"></div>
					<div id="dash-appointment-week-header-date">{formatWeekRange(date)}</div>
					<div id="dash-appointment-refresh" onClick={() => this.loadAppointments()}>
						<IoIosRefresh />
					</div>
					<div id="dash-appointment-forward" onClick={() => this.handleBrowse(true)}>
						<BsChevronRight />
					</div>
				</div>
				<div id="dash-appointment-week-content">
					{loading && <Loader overlay={false} />}
					<table key={"dash-appointment-table"} id="dash-appointment-week-table">
						<tbody className="dash-appointment-weekday">
							{days.length ? (
								days.map((day, idx) => {
									return (
										<React.Fragment key={idx}>
											<tr>
												<td className="dash-appointment-weekday-day" colSpan={3}>
													{moment(day.appointments[0].startTime).format("dddd Do")}
												</td>
											</tr>
											{day.appointments.map((app, i) => {
												return (
													<tr key={"tr" + i}>
														<td
															className={
																app.status === "CANCELLED"
																	? "dash-appointment-cancelled"
																	: "dash-appointment-fullname"
															}
														>
															{app.user &&
																capitalize(app.user.lastName) +
																	", " +
																	capitalize(app.user.firstName)}
														</td>
														<td className="dash-appointment-time">
															<span className="dash-appointment-time-marker">
																{current && current._id === app._id ? "→" : ""}
															</span>
															{moment(app.startTime).format("HH:mm")}{" "}
														</td>
														<td className="dash-appointment-store">
															{" "}
															{app.store ? (app.store.postalCode == 75010 ? "CM2" : "CM1") : ""}
														</td>
													</tr>
												);
											})}
										</React.Fragment>
									);
								})
							) : (
								<tr>
									<td className="dash-appointment-notfound">No appointments for this week...</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		);
	}
}

export default AppointmentBrowser;
