import React, { Component } from 'react';
import './GallerySection.css';
import ImageCarousel from '../util/ImageCarousel';

class GallerySection extends Component {
	constructor(props) {
		super(props);
		this.state = {
			images: props.images,
			quality: props.quality,
			loading: false,
		};
	}
	componentDidMount() {}
	async loadGallery(galleryId) {}
	render() {
		const { images, loading } = this.state;
		const { langCode } = this.props;

		if (loading) return <div className='gallery-loader'>...</div>;

		return (
			<div className='gallery-wrap'>
				<div className={'gallery-border-top'}></div>
				<ImageCarousel langCode={langCode} images={images} dots={true} autoPlay={true} />
			</div>
		);
	}
}

export default GallerySection;
