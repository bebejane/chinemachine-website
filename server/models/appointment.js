const mongoose = require('mongoose');
const moment = require('moment-timezone');
const Errors = require('../common/errors');
const User = require('../models/user');
const Schema = mongoose.Schema;

const APPOINTMENT_MAX_DAYS_INTERVAL = 7;

const AppointmentSchema = new Schema(
	{
		startTime: {
			type: Number,
			required: true,
		},
		endTime: {
			type: Number,
			required: true,
		},
		storeId: {
			type: Schema.Types.ObjectId,
			ref: 'Store',
			required: true,
		},
		langCode: {
			type: String,
			required: [true, 'Language code required'],
		},
		status: {
			type: String,
			required: true,
			default: 'ACTIVE',
		},
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: false,
			validate: {
				validator: (_id) =>
					new Promise((resolve, reject) => {
						//if(_id === null) return resolve()
						User.exists({ _id }, (err, exists) => {
							!exists || err ? reject(err || 'userId "' + _id + '" does not exist') : resolve();
						});
					}),
			},
		},
	},
	{ timestamps: true }
);

AppointmentSchema.virtual('user', {
	ref: 'User',
	localField: 'userId',
	foreignField: '_id',
	justOne: true,
});
AppointmentSchema.virtual('store', {
	ref: 'Store',
	localField: 'storeId',
	foreignField: '_id',
	justOne: true,
});
AppointmentSchema.set('toObject', { virtuals: true });
AppointmentSchema.set('toJSON', { virtuals: true });

AppointmentSchema.pre('save', async function (next) {
	try {
		const appoint = await Appointment.findById(this._id).lean();
		if (appoint && appoint.userId) throw Errors.create(Errors.APPOINTMENT_ALREADY_BOOKED, this.langCode);

		if (this.userId) {
			const startTime = moment(this.startTime).subtract(APPOINTMENT_MAX_DAYS_INTERVAL, 'days');
			const endTime = moment(this.startTime).add(APPOINTMENT_MAX_DAYS_INTERVAL, 'days');
			//console.log('check booked dates 7 days before, 7 days after', moment(this.startTime).format('YYYY-MM-DD'), startTime.format('YYYY-MM-DD'), endTime.format('YYYY-MM-DD'))
			const appointmentsLastDays = await Appointment.find()
				.where('userId')
				.equals(this.userId)
				.where('status')
				.ne('CANCELLED')
				.where('startTime')
				.gte(startTime.toDate().getTime())
				.where('startTime')
				.lte(endTime.toDate().getTime());

			if (appointmentsLastDays && appointmentsLastDays.length)
				throw Errors.create(Errors.APPOINTMENT_BOOKING_ILLIGAL_DATE, this.langCode);
		}
	} catch (err) {
		return next(err);
	}
	next();
});
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
module.exports = Appointment;
