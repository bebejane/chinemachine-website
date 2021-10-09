const mongoose = require('mongoose');
const moment = require('moment-timezone');
const Errors = require('../common/errors');
const User = require('../models/user');
const Appointment = require('../models/appointment');
const Schema = mongoose.Schema;

const AppointmentCancellationSchema = new Schema(
	{
		appointmentId: {
			type: Schema.Types.ObjectId,
			ref: 'Appointment',
			required: true,
		},
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			validate: {
				validator: (_id) =>
					new Promise((resolve, reject) => {
						User.exists({ _id }, (err, exists) => {
							!exists || err ? reject(err || 'userId "' + _id + '" does not exist') : resolve();
						});
					}),
			},
		},
	},
	{ timestamps: true }
);

const AppointmentCancellation =
	mongoose.models.AppointmentCancellation || mongoose.model('AppointmentCancellation', AppointmentCancellationSchema);
module.exports = AppointmentCancellation;
