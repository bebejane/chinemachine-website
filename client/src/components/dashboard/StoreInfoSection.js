import React, { Component } from 'react';
import 'rc-time-picker/assets/index.css';
import './StoreInfoSection.css';

import moment from 'moment';
import Loader from '../util/Loader';
import Button from '../util/Button';
import Select from 'react-select';
import TimePicker from 'rc-time-picker';

import storeService from '../../services/storeService';

const WEEKDAYS = moment.weekdays();
WEEKDAYS.push(WEEKDAYS.shift());
const DEFAULT_STORE = {
	name: '',
	address: '',
	postalCode: '',
	city: '',
	phone: '',
	openingHours: WEEKDAYS.map((wd, idx) => {
		return { start: 0, end: 0, name: wd };
	}),
	sellingHours: WEEKDAYS.map((wd, idx) => {
		return { start: 0, end: 0, name: wd };
	}),
	holidays: [],
	status: '',
};

class StoreInfoSection extends Component {
	constructor(props) {
		super(props);
		this.state = {
			stores: [],
			store: DEFAULT_STORE,
			loading: true,
		};
		this.handleStoreChange = this.handleStoreChange.bind(this);
		this.handleSaveStore = this.handleSaveStore.bind(this);
	}
	componentDidMount() {
		this.loadStores();
	}
	async loadStores() {
		this.setState({ loading: true });
		try {
			const stores = await storeService.getAll();
			this.setState({ stores, store: stores[0] || DEFAULT_STORE });
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ loading: false });
	}
	async handleSaveStore(store) {
		let { stores } = this.state;
		this.setState({ saving: true });
		try {
			console.log(store);
			const newStore = store._id ? await storeService.update(store._id, store) : await storeService.add(store);
			if (!store._id) stores.push(newStore);
			else stores = stores.map((s) => (s._id === newStore._id ? newStore : s));
			this.setState({ stores });
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ saving: false });
	}
	handleStoreChange({ value, name }) {
		console.log(value);
		const store = this.state.stores.filter((s) => s._id === value)[0];
		console.log(store);
		this.setState({ store });
	}
	handleError(err) {
		this.props.onError(err);
	}
	render() {
		const { stores, store, loading, saving } = this.state;

		if (loading) return <Loader />;

		return (
			<div id='dash-store-info'>
				{store._id && (
					<div id='dash-stores'>
						<div className='dash-store'>
							<StoreForm
								key={store._id}
								saving={saving}
								store={store}
								stores={stores}
								onSubmit={this.handleSaveStore}
								onStoreChange={this.handleStoreChange}
							/>
						</div>
					</div>
				)}
				 
				{/*stores.length &&
                    <div id='dash-store-select'>
                        <Select 
                            onChange={this.handleStoreChange}
                            options={stores.map((store)=> {return {value:store._id, label:store.name}})}
                        />
                    </div>
                */}
				{/*
                <div id='stores-add' >
                    <div id='stores-add-form'>
                        <StoreForm  
                            saving={saving}
                            store={DEFAULT_STORE} 
                            header={'Add store'} 
                            onSubmit={this.handleSaveStore}
                        /> 
                    </div>
                </div>
                */}
			</div>
		);
	}
}

class StoreForm extends Component {
	constructor(props) {
		super(props);
		this.state = {
			store: props.store,
			weekdays: WEEKDAYS,
			hours: new Array(24).fill(0).map((v, h) => {
				return { value: h, label: h < 10 ? '0' + h : h };
			}),
			minutes: new Array(60).fill(0).map((v, m) => {
				return { value: m, label: m < 10 ? '0' + m : m };
			}),
			saving: props.saving,
		};
		this.handleFormChange = this.handleFormChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleFormChange(e) {
		const { store } = this.state;
		store[e.target.id] = e.target.value;
		this.setState({ store });
	}
	handleFormChangeHour(type, day, key, date) {
		console.log(type, day, key, date);

		const { store } = this.state;

		store[type][day][key] = date ? date.hours() * 60 + date.minutes() : 0;
		console.log(store);
		this.setState({ store });
	}
	handleSubmit(e) {
		e.preventDefault();
		const { store } = this.state;
		this.props.onSubmit(store);
	}
	static getDerivedStateFromProps(nextProps, prevState) {
		console.log('.');
		return nextProps;
	}
	render() {
		const { saving, store, weekdays } = this.state;

		const { header, stores } = this.props;

		return (
			<div className='stores-form-wrap'>
				<form className='store-form' onSubmit={this.handleSubmit}>
					<div className='store-form-content'>
						{header && <div className='store-form-content-row-header'>{header}</div>}
						{stores && (
							<div className='store-form-content-store-selector'>
								<Select
									onChange={this.props.onStoreChange}
									value={{ value: store._id, label: store.name }}
									menuPlacement='bottom'
									isSearchable={false}
									options={stores.map((store) => {
										return { value: store._id, label: store.name };
									})}
								/>
							</div>
						)}
						<div className='store-form-content-row'>
							<input
								id='name'
								name='name'
								value={store.name}
								autoComplete='off'
								type='hidden'
								placeholder='Name...'
								onChange={this.handleFormChange}
							/>
						</div>
						<div className='store-form-content-row'>
							<input
								id='address'
								name='address'
								value={store.address}
								autoComplete='off'
								type='text'
								placeholder='Address...'
								onChange={this.handleFormChange}
							/>
						</div>
						<div className='store-form-content-row'>
							<input
								id='phone'
								name='phone'
								value={store.phone}
								type='text'
								autoComplete='off'
								placeholder='Phone...'
								onChange={this.handleFormChange}
							/>
						</div>
						<div className='store-form-content-row'>
							<input
								id='postalCode'
								name='postalCode'
								value={store.postalCode}
								autoComplete='off'
								type='text'
								placeholder='Postal code...'
								onChange={this.handleFormChange}
							/>
						</div>
						<div className='store-form-content-row'>
							<input
								id='city'
								name='city'
								value={store.city}
								type='text'
								autoComplete='off'
								placeholder='City...'
								onChange={this.handleFormChange}
							/>
						</div>
						<div className='store-form-content-row'>
							<input
								id='status'
								name='status'
								value={store.status}
								type='text'
								autoComplete='off'
								placeholder='Status message...'
								onChange={this.handleFormChange}
							/>
						</div>
						{store && store.openingHours && store.sellingHours && (
							<div className='store-form-content-row'>
								<div className='store-form-content-hours'>
									<div className='store-form-content-hours-wrap'>
										<div className='store-form-content-hours-days'>
											<div className='store-form-content-hours-header'>Opening hours</div>
											{weekdays.map((wd, idx) => (
												<div key={idx + 'opening'} className='store-form-content-hours-day'>
													<div className='store-form-content-hours-weekday'>{wd}</div>
													<div className='store-form-content-hours-start'>
														<TimePicker
															className='store-form-timepicker'
															popupClassName='store-form-timepicker-popup'
															placeholder='HH:MM'
															defaultValue={moment().hours(12)}
															value={moment()
																.startOf('day')
																.add('minutes', store.openingHours[idx].start || 0)}
															onChange={(value) => this.handleFormChangeHour('openingHours', idx, 'start', value)}
															showSecond={false}
															minuteStep={15}
														/>
													</div>
													<div className='store-form-content-hours-end'>
														<TimePicker
															className='store-form-timepicker'
															popupClassName='store-form-timepicker-popup'
															defaultValue={moment().hours(20)}
															value={moment()
																.startOf('day')
																.add('minutes', store.openingHours[idx].end || 0)}
															onChange={(value) => this.handleFormChangeHour('openingHours', idx, 'end', value)}
															showSecond={false}
															minuteStep={15}
														/>
													</div>
												</div>
											))}
										</div>

										<div className='store-form-content-hours-days'>
											<div className='store-form-content-hours-header'>Selling hours</div>
											{weekdays.map((wd, idx) => (
												<div key={idx + 'selling'} className='store-form-content-hours-day'>
													<div className='store-form-content-hours-weekday'>{wd}</div>
													<div className='store-form-content-hours-start'>
														<TimePicker
															className='store-form-timepicker'
															popupClassName='store-form-timepicker-popup'
															value={moment()
																.startOf('day')
																.add('minutes', store.sellingHours[idx].start || 0)}
															onChange={(value) => this.handleFormChangeHour('sellingHours', idx, 'start', value)}
															showSecond={false}
															minuteStep={15}
														/>
													</div>
													<div className='store-form-content-hours-end'>
														<TimePicker
															className='store-form-timepicker'
															popupClassName='store-form-timepicker-popup'
															value={moment()
																.startOf('day')
																.add('minutes', store.sellingHours[idx].end || 0)}
															onChange={(value) => this.handleFormChangeHour('sellingHours', idx, 'end', value)}
															showSecond={false}
															minuteStep={15}
														/>
													</div>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						)}
						{/*}
                        <div className='store-form-content-row'>
                            <div className='store-form-content-holidays'>
                            holidays
                            </div>
                        </div>
                        */}
						 
						<div className='store-form-content-bottom'>
							<div className='store-form-content-save'>
								<Button type='submit' loading={saving}>
									SAVE
								</Button>
							</div>
						</div>
					</div>
				</form>
			</div>
		);
	}
}

export default StoreInfoSection;
