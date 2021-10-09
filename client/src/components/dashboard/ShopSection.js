import React, { Component } from 'react';
import './ShopSection.css';
import Checkbox from '../util/Checkbox';
import Button from '../util/Button';
import Loader from '../util/Loader';
import ImageCarousel from '../util/ImageCarousel';
import shopService from '../../services/shopService';

class ShopSection extends Component {
	constructor(props) {
		super(props);
		this.state = {
			products: [],
			product: {},
			marked: {},
			loading: true,
			changed: false,
			page: 1,
		};
		this.handleToggleProduct = this.handleToggleProduct.bind(this);
		this.handleViewProduct = this.handleViewProduct.bind(this);
	}
	componentDidMount() {
		this.loadProducts();
	}
	async loadProducts(nextPage = 1, type) {
		this.setState({ loading: type || 'products' });

		try {
			const products = await shopService.latest(nextPage);
			const latest = await shopService.latest();
			const marked = { ...this.state.marked };
			latest.forEach((p) => (marked[p.productId] = p));

			if (products.length !== 0) this.setState({ products, page: nextPage, marked, product: {} });
		} catch (err) {
			this.props.onError(err);
		}
		this.setState({ loading: false });
	}
	handleBrowse(ffw) {
		let { page } = this.state;
		this.loadProducts(ffw ? ++page : --page, ffw ? 'next' : 'prev');
	}
	async handleSave() {
		this.setState({ saving: true });
		const { marked, page } = this.state;
		console.log(marked);
		try {
			const addProducts = Object.keys(marked)
				.filter((k) => marked[k])
				.map((k) => {
					return { ...marked[k] };
				});
			console.log(addProducts);
			await shopService.addMany(addProducts);
			const newProducts = await shopService.page(page);
			this.setState({ products: newProducts });
		} catch (err) {
			this.props.onError(err);
		}
		this.setState({ saving: false, changed: false });
	}
	async handleToggleProduct(product, checked) {
		const { marked } = this.state;
		marked[product.productId] = checked ? product : undefined;
		this.setState({ marked, changed: true });
	}
	async handleViewProduct(prod) {
		const { product } = this.state;
		if (product && product.productId === prod.productId) this.setState({ product: {} });
		else {
			try {
				const images = await shopService.getImages(prod.productId);
				prod.images = images;
				this.setState({ product: prod });
			} catch (err) {
				this.props.onError(err);
			}
		}
	}
	render() {
		const { products, product, page, loading, saving, marked, changed } = this.state;

		if (loading) return <Loader />;

		return (
			<div id='dash-shop'>
				<div className={'dash-shop-product-wrap'}>
					{products.map((p, idx) => (
						<div
							key={idx}
							className={p.productId === product.productId ? 'dash-shop-product-full' : 'dash-shop-product'}
						>
							<div className={'dash-shop-product-image'} onClick={() => this.handleViewProduct(p)}>
								{p.productId === product.productId && product.images ? (
									<ImageCarousel
										images={product.images.map((i) => {
											return { src: i.url_fullxfull };
										})}
										autoPlay={true}
										dots={true}
									/>
								) : (
									<img alt='' src={p.image && p.image.url_170x135} />
								)}
							</div>
							<div className={'dash-shop-product-details'}>
								<div className={'dash-shop-product-title'}>{p.title}</div>
								{p.productId === product.productId && (
									<div>
										<div className={'dash-shop-product-desc'}>{p.description}</div>
										<div className={'dash-shop-product-price'}>{p.price} EUR</div>
									</div>
								)}
								{/*}
                                <div className={'dash-shop-product-toggle'}>
                                    <Checkbox
                                        id={p.productId || p.productId}
                                        //checked={marked[p.productId] === undefined  ? false : true} 
                                        checked={p.show} 
                                        onChange={(checked)=>this.handleToggleProduct(p, checked)}
                                    />
                                </div>
                                */}
							</div>
						</div>
					))}
				</div>
				<div className={'dash-shop-product-buttons'}>
					<div className={'dash-shop-product-buttons-left'}>
						{/*<Button loading={saving} disabled={!changed} onClick={()=>this.handleSave()}>SAVE</Button>*/}
					</div>
					<div className={'dash-shop-product-buttons-right'}>
						<Button disabled={page === 1} loading={loading === 'prev'} onClick={() => this.handleBrowse(false)}>
							PREV
						</Button>
						<Button loading={loading === 'next'} onClick={() => this.handleBrowse(true)}>
							NEXT
						</Button>
					</div>
				</div>
			</div>
		);
	}
}

export default ShopSection;
