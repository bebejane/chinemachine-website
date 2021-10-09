import React, { Component } from 'react';
import ReactSwipe from 'react-swipe';
import Slider from 'react-slick';
import './ImageCarousel.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const sliderSettings = {
	dots: true,
	infinite: true,
	arrows: false,
	speed: 500,
	slidesToShow: 1,
	slidesToScroll: 1,
	dotsClass: 'image-carousel-dots',
};

class ImageCarousel extends Component {
	constructor(props) {
		super(props);
		this.state = {
			index: 0,
			loading: false,
			loadingProgress: undefined,
			sizes: [],
		};
		this.handleGoTo = this.handleGoTo.bind(this);
		this.slider = {
			slickGoTo: (index) => {
				this.handleGoTo(index);
			},
		};
		this.handleRef = this.handleRef.bind(this);
		this.handleBeforeChange = this.handleBeforeChange.bind(this);
		this.handleAfterChange = this.handleAfterChange.bind(this);
		this.handleGoNext = this.handleGoNext.bind(this);
		this.reactSwipeEl = null;
	}
	componentDidMount() {
		this.handleLoading();
		if (this.props.onRef) this.props.onRef(this.slider);
		if (this.props.autoPlay) this.handleAutoPlay();
	}
	componentWillUnmount() {
		clearInterval(this.autoPlayInterval);
	}
	handleClick(e) {}
	handleBeforeChange(index, item) {
		if (this.props.onBeforeChange) this.props.onBeforeChange(index, item);
	}
	handleAfterChange(index, item) {
		if (this.props.onAfterChange) this.props.onAfterChange(index, item);
	}
	handleRef(slider) {
		if (this.props.onRef) this.props.onRef(slider);
	}
	handleGoNext(e) {
		const { index } = this.state;
		const { images } = this.props;
		this.setState({ index: index === images.length - 1 ? 0 : index + 1 });
	}
	handleGoTo(index, e) {
		this.setState({ index });
	}
	handleDotClick(e, index) {
		clearInterval(this.autoPlayInterval);
		this.handleGoTo(index);
		e.stopPropagation();
	}
	handleAutoPlay() {
		const { speed } = this.props;
		this.autoPlayInterval = setInterval(() => {
			const { images } = this.props;
			const index = this.state.index + 1 >= images.length ? 0 : this.state.index + 1;
			this.handleGoTo(index);
		}, speed || 3000);
	}
	handleLoading() {
		const images = document.getElementsByClassName('image-carousel-image');

		let loaded = 0;
		for (var i = 0; i < images.length; i++) {
			if (images[i].complete) {
				this.setState({
					loadingProgress: { total: images.length, loaded: ++loaded },
				});
				continue;
			}
			images[i].addEventListener('load', () => {
				if (++loaded === images.length) this.handleAllLoaded();

				const sizes = [];
				for (var i = 0; i < images.length; i++) sizes.push({ h: images[i].naturalHeight, w: images[i].naturalWidth });

				this.setState({
					sizes,
					loadingProgress: { total: images.length, loaded },
				});
			});
		}

		this.setState({ loading: loaded === images.length ? false : true });
	}
	handleAllLoaded() {
		if (this.props.onLoaded) this.props.onLoaded();

		this.setState({ loading: false });
	}
	render() {
		const { images, langCode, dots, autoplay, lazyload } = this.props;
		const { index } = this.state;
		const wrapStyle = {};
		const imageQuality = 'medium';

		return (
			<Slider
				className='image-carousel-wrap'
				{...sliderSettings}
				autoplay={autoplay}
				dots={dots}
				lazyload={lazyload}
				ref={(slider) => this.handleRef(slider)}
				afterChange={(index) => this.handleAfterChange(index)}
			>
				{images.map((image, idx) => (
					<div key={'image-' + image._id + '-' + idx}>
						<img
							className={'image-carousel-image'}
							src={image.imageId ? '/api/image/' + image.imageId + '/image/' + imageQuality : image.src}
							alt=''
						/>
						{image.labels && image.labels[langCode] && (
							<div className={'image-carousel-image-label'}>
								<h3 className={'image-carousel-image-label-text'}>{image.labels[langCode]}</h3>
							</div>
						)}
					</div>
				))}
			</Slider>
		);
	}
}
export default ImageCarousel;
