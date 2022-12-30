const Email = require("../email");
const Errors = require("../common/errors");
const Appointment = require("../models/appointment");
const AppointmentCancellation = require("../models/appointmentCancellation");
const userController = require("../controllers/user");
const moment = require("moment-timezone");

const get = async (id) => {
	if (!id) throw new Error("ID invalid");

	const appointment = await Appointment.findById(id)
		.populate("user", "email phone firstName lastName _id")
		.populate("store")
		.sort("startTime")
		.lean();
	return appointment;
};
const getAll = async () => {
	const appointments = await Appointment.find({})
		.populate("user", "email phone firstName lastName _id")
		.populate("store")
		.sort("startTime")
		.lean();
	return appointments;
};

const getByMonth = async (year, month, storeId) => {
	if (isNaN(year) || isNaN(month)) throw new Error("Year or month invalid");

	const startTime = moment.tz(new Date(year, month, 1, 0), "Europe/Paris").unix() * 1000;
	const endTime = moment.tz(new Date(year, month + 1, 0, 23, 59, 59), "Europe/Paris").unix() * 1000;
	const appointments = await Appointment.find()
		.gte("startTime", startTime)
		.lte("endTime", endTime)
		.where("storeId")
		.equals(storeId)
		//.where('status').ne('CANCELLED')
		//.populate('user', 'email phone firstName lastName _id')
		//.populate('user', 'email phone firstName lastName _id')
		.populate("store")
		.sort("startTime")
		.lean();
	return appointments;
};
const getAllByMonth = async (year, month) => {
	if (isNaN(year) || isNaN(month)) throw new Error("Year or month invalid");

	const startTime = moment.tz(new Date(year, month, 1, 0), "Europe/Paris").unix() * 1000;
	const endTime = moment.tz(new Date(year, month + 1, 0, 23, 59, 59), "Europe/Paris").unix() * 1000;

	const appointments = await Appointment.find({})
		.gte("startTime", startTime)
		.lte("endTime", endTime)
		//.populate('user', 'email phone firstName lastName _id')
		.populate("store")
		.sort("startTime")
		.lean();
	return appointments;
};
const getByDate = async (year, month, date, storeId) => {
	if (isNaN(year) || isNaN(month) || isNaN(date)) throw new Error("Year or month or date invlaid");
	if (!date) throw new Error("Invalid date");
	if (!storeId) throw new Error("Invalid storeId");

	const startTime = moment.tz(new Date(year, month, date, 0, 0, 0), "Europe/Paris").unix() * 1000;
	const endTime = moment.tz(new Date(year, month, date, 23, 59, 59), "Europe/Paris").unix() * 1000;

	const appointments = await Appointment.find()
		.gte("startTime", startTime)
		.lte("endTime", endTime)
		.where("storeId")
		.equals(storeId)
		//.where('status').ne('CANCELLED')
		//.populate('user', 'email phone firstName lastName _id')
		.populate("store")
		.sort("startTime");
	return appointments;
};
const getAllByDate = async (year, month, date) => {
	if (isNaN(year) || isNaN(month) || isNaN(date)) throw new Error("Year or month or date invlaid");
	if (!date) throw new Error("Invalid date");

	const startTime = moment.tz(new Date(year, month, date, 0, 0, 0), "Europe/Paris").unix() * 1000;
	const endTime = moment.tz(new Date(year, month, date, 23, 59, 59), "Europe/Paris").unix() * 1000;

	const appointments = await Appointment.find()
		.gte("startTime", startTime)
		.lte("endTime", endTime)
		//.populate('user', 'email phone firstName lastName _id')
		.populate("store")
		.sort("startTime");
	return appointments;
};
const getAllByWeek = async (year, week) => {
	if (isNaN(year) || isNaN(week)) throw new Error("Year or week invalid");

	const startDate = moment()
		.year(parseInt(year))
		.isoWeek(parseInt(week))
		.hour(0)
		.minute(0)
		.second(0)
		.isoWeekday(1);
	const endDate = moment(startDate).add(7, "days");
	const startTime = startDate.unix() * 1000;
	const endTime = endDate.unix() * 1000;

	const appointments = await Appointment.find({})
		.gte("startTime", startTime)
		.lte("endTime", endTime)
		.populate("user", "email phone firstName lastName _id")
		.populate("store")
		.sort("startTime")
		.lean();
	return appointments;
};
const getByUser = async (userId) => {
	if (!userId) throw new Error("Invalid userId");

	const appointments = await Appointment.find()
		.where("userId")
		.equals(userId)
		.where("status")
		.ne("CANCELLED")
		.populate("user")
		.populate("store")
		.sort("startTime");
	return appointments;
};
const getAllByUser = async (userId) => {
	if (!userId) throw new Error("Invalid userId");

	const appointments = await Appointment.find()
		.where("userId")
		.equals(userId)
		.populate("user")
		.populate("store")
		.sort("startTime");
	return appointments;
};
const getActiveCount = async () => {
	const startTime = moment.tz(new Date(), "Europe/Paris").unix() * 1000;

	const appointments = await Appointment.find()
		.where("status")
		.equals("ACTIVE")
		.where("startTime")
		.gte(startTime);
	return { activeCount: appointments.length };
};
const add = async (appointment) => {
	const newAppointment = await Appointment.create(appointment);
	return await get(newAppointment._id);
};
const update = async (id, appointment) => {
	const newAppointment = await Appointment.findById(id);
	if (!newAppointment) throw new Error("Appointment not found");

	Object.keys(appointment).forEach((k) => {
		newAppointment[k] = appointment[k];
	});
	await newAppointment.save();
	return await get(newAppointment._id);
};

const upsert = async (appointment) => {
	return !appointment._id
		? await add(appointment)
		: await update(appointment._id, { ...appointment });
};
const remove = async (id) => {
	const appointment = await Appointment.findByIdAndDelete(id).lean();
	return appointment;
};
const removeAll = async () => {
	const appointments = await Appointment.deleteMany({}).lean();
	return appointments;
};
const book = async (userId, appointmentId, langCode) => {
	const appointment = await Appointment.findById(appointmentId)
		.populate("user", "email phone firstName lastName _id")
		.populate("store");
	const user = await userController.get(userId);

	if (!appointment) throw new Error("Appointment not found");
	else if (appointment.status === "BOOKED") throw new Error("Appointment has already been booked");

	if (!user) throw new Error("User account not found");

	appointment.userId = userId;
	appointment.status = "BOOKED";
	await appointment.save();
	await Email.appointmentBooked(user, appointment, langCode);
	return get(appointment._id);
};
const cancel = async (appointmentId, langCode) => {
	const appointment = await get(appointmentId);

	if (!appointment) throw new Error("Appointment not found");

	await AppointmentCancellation.create({
		appointmentId: appointment._id,
		userId: appointment.userId,
	});
	await Appointment.findByIdAndUpdate(appointment._id, {
		status: "ACTIVE",
		userId: null,
	});
	await Email.appointmentCancelled(appointment.user, appointment, langCode);
	return get(appointmentId);
};
module.exports = {
	get,
	getAll,
	getByMonth,
	getAllByMonth,
	getAllByWeek,
	getByUser,
	getAllByUser,
	getByDate,
	getAllByDate,
	getActiveCount,
	add,
	update,
	upsert,
	remove,
	removeAll,
	cancel,
	book,
};
