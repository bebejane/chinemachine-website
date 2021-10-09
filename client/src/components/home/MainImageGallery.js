import React, { Component } from 'react';
import ImageCarousel from '../util/ImageCarousel'
import galleryService from '../../services/galleryService'

class MainImageGallery extends Component {
	constructor(props){
		super(props)
		this.state = {
			gallery:undefined
		}  
	}
	componentDidMount(){
		this.loadGallery()
	}
	async loadGallery(){
		const gallery = await galleryService.getMain(this.props.langCode)
		this.setState({gallery})
	}
	render() { 
		const {gallery} = this.state;
		const {langCode} = this.props
		if(!gallery || !gallery.images || !gallery.images.length) return null
			return (
				<div className='gallery-wrap'>
					<div className={'maingallery-border-top'}></div>
					<ImageCarousel 
						langCode={langCode}
						images={gallery.images}
						autoplay={true}
						height={600}
						dots={false}
					/>
					<div className={'gallery-border-bottom'}></div>
				</div>
		)
	}
}

export default MainImageGallery