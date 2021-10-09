import React, { Component } from 'react';
import './ErplyBrowser.css';
import Loader from '../util/Loader';
import moment from 'moment-timezone';
import Calendar from 'react-calendar';
import { BsChevronLeft, BsChevronRight,BsCalendar } from 'react-icons/bs';
import { IoIosRefresh } from 'react-icons/io';
import erplyService from '../../services/erplyService';

class ErplyBrowser extends Component {
	constructor(props) {
		super(props);
		this.state = {
			loading: true,
			date: new Date(),
			stores: [],
			storeIndex: 0,
			warehouseId: 1,
			showCalendar: false,
		};
		this.handleDateChanged = this.handleDateChanged.bind(this);
		this.handleToggleCalendar = this.handleToggleCalendar.bind(this);
	}
	async componentDidMount() {
		await this.loadStores();
		this.loadSales(this.state.date);
	}
	componentWillUnmount() {
		// fix Warning: Can't perform a React state update on an unmounted component
		this.setState = (state, callback) => {
			return;
		};
	}
	handleBrowse(ffw) {
		const date = this.state.date;
		const newDate = (ffw ? moment(date).add(1, 'days') : moment(date).subtract(1, 'days')).toDate();
		this.loadSales(newDate);
	}
	handleBrowseStore(ffw) {
		let { stores, warehouseId } = this.state;
		warehouseId = ffw
			? warehouseId >= stores.length
				? 1
				: warehouseId + 1
			: warehouseId <= 1
			? stores.length
			: warehouseId - 1;
		const store = stores.filter((s) => parseInt(s.warehouseID) === parseInt(warehouseId))[0];
		this.setState({ store, warehouseId }, () => {
			this.loadSales();
		});
	}
	async loadStores() {
		let stores;
		this.setState({ loading: true });
		try {
			const warehouseId = this.state.warehouseId;
			stores = await erplyService.getStores(warehouseId);
			const store = stores.filter((s) => parseInt(s.warehouseID) === parseInt(warehouseId))[0];
			this.setState({ stores, store });
		} catch (error) {
			this.handleError(error);
		}
		this.setState({ loading: false });
		return stores;
	}
	async loadSales(date) {
		const oldDate = this.state.date;
		date = new Date(date || this.state.date);
		this.setState({ loading: true, date, sales: undefined });
		try {
			const warehouseId = this.state.warehouseId;
			const sales = await erplyService.getSalesReport(date, warehouseId);
			this.setState({ sales, date, warehouseId });
		} catch (error) {
			this.handleError(error);
			this.setState({ date: oldDate });
		}
		this.setState({ loading: false });
	}
	handleToggleCalendar() {
		this.setState({ showCalendar: !this.state.showCalendar });
	}
	handleError(error) {
		this.setState({ error });
		if (this.props.onError) this.props.onError(error);
		else console.error(error);
	}
	handleDateChanged(date) {
		this.setState({ showCalendar: false });
		this.loadSales(date);
	}
	render() {
		const { date, sales, store, loading, showCalendar } = this.state;

		const transactions =
			sales && sales.transactions
				? sales.transactions.map((trans) =>
						trans.products.map((p, idx) => {
							const time = idx === 0 ? trans.time.substring(0, 5) : '';
							const { discount, price } = p;
							const product = sales.products.filter((prod) => prod.productID === p.productID)[0];
							const last = trans.products.length - 1 === idx;
							const first = idx === 0;

							return (
								<React.Fragment key={idx + 'trans'}>
									{first && (
										<tr key={idx + 'time'} className='dash-erply-sales-row'>
											<td colSpan={5} className='dash-erply-sales-row-time'>
												{time}
											</td>
										</tr>
									)}
									<tr key={idx} className='dash-erply-sales-row'>
										<td className='dash-erply-sales-row-product'>{product.name}</td>
										<td className='dash-erply-sales-row-desc'>{product.description}</td>
										<td className='dash-erply-sales-row-price'>
											<span className='dash-erply-sales-row-discount'>{discount ? '-' + discount.toFixed(0) + '%' : ''}</span>
											{price}&euro;
										</td>
									</tr>
									{last && trans.discount > 0 && (
										<tr key={idx + 'discount'} className='dash-erply-sales-row-discont'>
											<td colSpan={3} className='dash-erply-sales-row-customer'>
												*{' '}
												{trans.customer.name === 'Customer, Default' ? trans.notes || 'Discount' : trans.customer.name}
											</td>
										</tr>
									)}
									{last && (
										<tr key={idx + 'total'} className='dash-erply-sales-row-end'>
											<td colSpan={3} className='dash-erply-sales-row-total'>
												{trans.total}&euro;
											</td>
										</tr>
									)}
								</React.Fragment>
							);
						})
				  )
				: [];

		return (
			<div id='dash-erply'>
				<div id='dash-erply-store-browser'>
					<div className='dash-erply-back' onClick={() => this.handleBrowseStore(false)}>
						<BsChevronLeft />
					</div>
					<div id='dash-erply-header-store'>{store ? store.name : ''}</div>
					<div className='dash-erply-forward' onClick={() => this.handleBrowseStore(true)}>
						<BsChevronRight />
					</div>
				</div>
				<div id='dash-erply-browser'>
					<div className='dash-erply-back' onClick={() => this.handleBrowse(false)}>
						<BsChevronLeft />
					</div>
					<div id='dash-erply-refresh' onClick={this.handleToggleCalendar}><BsCalendar/></div>
					<div id='dash-erply-header-date'>
						{moment().isSame(date, 'day') ? 'Today' : moment(date).format('ddd MMM Do')}
					</div>
					<div id='dash-erply-refresh' onClick={() => this.loadSales()}>
						<IoIosRefresh />
					</div>
					<div className='dash-erply-forward' onClick={() => this.handleBrowse(true)}>
						<BsChevronRight />
					</div>
				</div>
				{showCalendar && (
					<div id='dash-erply-browser-months'>
						<Calendar
							onClickDay={this.handleDateChanged}
							value={date}
							next2Label={null}
							prev2Label={null}
							showNeighboringMonth={false}
						/>
					</div>
				)}
				<div id='dash-erply-content'>
					<div id='dash-erply-content-wrap'>
						{sales && sales.dayTotal ? (
							<React.Fragment>
								<div className='dash-erply-content-row'>
									<table id='dash-erply-totals'>
										<tbody>
											<tr>
												<th>Total</th>
												<th>Cash</th>
												<th>Card</th>
												<th>Exch</th>
											</tr>
											<tr>
												<td>{sales.dayTotal.toFixed(0)}&euro;</td>
												<td>{sales.dayTotalCash.toFixed(0)}&euro;</td>
												<td>{sales.dayTotalCard.toFixed(0)}&euro;</td>
												<td>{sales.dayTotalCredit.toFixed(0)}&euro;</td>
											</tr>
										</tbody>
									</table>
								</div>
								<div className='dash-erply-content-row'>
									<div id='dash-erply-working'>
										<div className='dash-erply-report-header'>Working</div>
										{sales.clockins.map((clockin, idx) => (
											<div key={idx} className='dash-erply-clockin'>
												<div className='dash-erply-clockin-time'>
													{moment.unix(clockin.InUnixTime).format('HH:mm')} -{' '}
													{clockin.OutUnixTime ? moment.unix(clockin.OutUnixTime).format('HH:mm') : 'XX:XX'}
												</div>
												<div className='dash-erply-clockin-name'>{clockin.employee.employeeName}</div>
											</div>
										))}
									</div>
								</div>
								<div className='dash-erply-content-row'>
									<div id='dash-erply-sales'>
										<div className='dash-erply-report-header'>Sales</div>
										<table id='dash-erply-sales-table'>
											<tbody>
												{transactions}
												<tr key={'total'} className='dash-erply-sales-row-total-all'>
													<td colSpan={2}>Total:</td>
													<td>{sales.dayTotal}&euro;</td>
												</tr>
											</tbody>
										</table>
									</div>
								</div>
							</React.Fragment>
						) : (
							<div className='dash-erply-nosales'>No sales for this day...</div>
						)}
						 
					</div>
					{loading && <Loader />}
				</div>
			</div>
		);
	}
}

export default ErplyBrowser;
