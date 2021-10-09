import React, { Component } from 'react';
import './ShopSection.css';
import Button from '../util/Button';
import Loader from '../util/Loader';
import ImageCarousel from '../util/ImageCarousel';
import shopService from '../../services/shopService';
import etsyLogo from '../../images/etsy-logo.png';
import depopLogo from '../../images/depop-logo.png';

const entities = require('entities');

class ShopSection extends Component {
	constructor(props) {
		super(props);
		this.state = {
			products: [],
			index: 0,
			page: 1,
			loading: false,
			maxPage: false,
			product: [],
		};
		this.handleLoadMoreProducts = this.handleLoadMoreProducts.bind(this);
		this.loadProducts = this.loadProducts.bind(this);
	}
	componentDidMount() {
		this.loadProducts();
	}
	async loadProducts(page = 1) {
		this.setState({ loading: true });
		let { products } = this.state;

		try {
			let pageProducts = await shopService.latest(page);
			if (pageProducts && pageProducts.length) {
				products = products.concat(pageProducts).map( (p) => {
					return {
						...p,
						description: entities.decode(p.description)
					};
				});

				this.setState({ products, page, maxPage: false });
				
			} else this.setState({ page: page, maxPage: true });
		} catch (err) {
			this.props.onError(err);
		}
		this.setState({ loading: false });
	}
	async loadImages(product) {
		const images = await shopService.getImages(product.productId);
		return Promise.resolve(images);
	}
	async handleViewProduct(prod, index) {
		let { products } = this.state;
		this.setState({ loadingProduct: prod.productId });
		prod.images = await this.loadImages(prod);
		products = products.map((p) => (p.productId === prod.productId ? prod : p));
		this.setState({ products, loadingProduct: false });
	}
	async handleLoadMoreProducts(idx) {
		const { page } = this.state;
		this.loadProducts(page + 1);
	}
	scrollIntoView() {
		const element = document.getElementById('onlineshop');
		if (!element) return;
		setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
	}
	render() {
		const { dict } = this.props;
		const { products, product, index, page, maxPage, loading, loadingProduct } = this.state;
		const buttonStyle = { border: '1px solid rgba(255,255,255,0.5)', margin: 2, color: '#fff' };
		const prods = products.map((p, idx) => (
			<div className={product ? 'shop-product-full' : 'shop-product'}>
				<div className='shop-product-image-wrap' onClick={() => this.handleViewProduct(p)}>
					<ImageCarousel
						images={
							p.images
								? p.images.map((i) => {
										return { src: i.url_fullxfull };
								  })
								: [{ src: p.image.url_570xN }]
						}
						dots={p.images ? true : false}
						lazyload={true}
					/>
					{loadingProduct === p.productId && <Loader invert={true} />}
				</div>
				<div className='shop-product-details'>
					<a href={p.url} onClick={(e) => e.stopPropagation()}>
						<h2 className='shop-product-title'>{p.title}</h2>
					</a>
					<div className='shop-product-desc'>{p.description}</div>
					<div className='shop-product-bottom'>
						<div className='shop-product-price'>{p.price}€</div>
						<div className='shop-product-buy'>
							<a href={p.url} onClick={(e) => e.stopPropagation()}>
								<div className='shop-product-buy-button'>{'GET IT'}</div>
							</a>
						</div>
					</div>
				</div>
			</div>
		));
		return (
			<React.Fragment>
				<div id='shop-etsy-header'>
					<div id='shop-etsy-header-visit'>{dict.visitUsAt}</div>
					<div>
						<a href='https://www.etsy.com/shop/Chinemachine'>
							<img src={etsyLogo} />
						</a>
						<a href='https://www.depop.com/chinemachine'>
							<img src={depopLogo} />
						</a>
					</div>
				</div>
				<div id='shop-products'>
					{prods}
					<div className='shop-product-buttons'>
						<Button
							loading={loading}
							disabled={index === products.length - 1 || maxPage}
							style={buttonStyle}
							onClick={this.handleLoadMoreProducts}
						>
							{dict.loadMore}
						</Button>
					</div>
					{loading && <Loader invert={true} />}
				</div>
			</React.Fragment>
		);
	}
}

export default ShopSection;
