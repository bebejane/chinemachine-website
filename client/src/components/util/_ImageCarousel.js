import React, { Component } from 'react';
import ReactSwipe from 'react-swipe';
import './ImageCarousel.css'

class ImageCarousel extends Component {
    constructor(props) {
        super(props)
        this.state = {
            index:0,
            loading:false,
            loadingProgress:undefined,
            sizes:[]
        }
        this.handleGoTo = this.handleGoTo.bind(this)
        this.slider = {
            slickGoTo:(index)=>{
                this.handleGoTo(index)
            }
        }
        this.handleRef = this.handleRef.bind(this)
        this.handleBeforeChange = this.handleBeforeChange.bind(this)
        this.handleAfterChange = this.handleAfterChange.bind(this)
        this.handleGoNext  = this.handleGoNext.bind(this)
        this.reactSwipeEl = null;
    }
    componentDidMount(){
        this.handleLoading()
        if(this.props.onRef)
            this.props.onRef(this.slider)
        if(this.props.autoPlay)
            this.handleAutoPlay()
    }
    componentWillUnmount(){
        clearInterval(this.autoPlayInterval)
    }
    handleClick(e){
        
    }
    handleBeforeChange(index,item){
        if(this.props.onBeforeChange)
            this.props.onBeforeChange(index,item)
    }
    handleAfterChange(index,item){
        if(this.props.onAfterChange)
            this.props.onAfterChange(index,item)
    }
    handleRef(slider){
        if(this.props.onRef)
            this.props.onRef(slider)
    }
    handleGoNext(e){
        const {index} = this.state;
        const {images} = this.props
        this.setState({index:index === images.length-1 ? 0 : index+1})
    }
    handleGoTo(index,e){
        this.setState({index})
    }
    handleDotClick(e, index){
        clearInterval(this.autoPlayInterval)
        this.handleGoTo(index)
        e.stopPropagation()
    }
    handleAutoPlay(){
        const {speed} = this.props;
        this.autoPlayInterval = setInterval(()=>{
            const {images} = this.props;
            const index = this.state.index+1 >= images.length ? 0 : this.state.index+1;
            this.handleGoTo(index)
        },speed || 3000)
    }
    handleLoading(){
        const images = document.getElementsByClassName('image-carousel-image');
        
        let loaded = 0;
        for (var i = 0; i < images.length; i++) {
            if(images[i].complete){
                this.setState({loadingProgress:{total:images.length, loaded:++loaded}})
                continue;
            }
            images[i].addEventListener('load', ()=>{
                if(++loaded === images.length)
                    this.handleAllLoaded()

                const sizes = []
                for (var i = 0; i < images.length; i++)
                    sizes.push({h:images[i].naturalHeight, w:images[i].naturalWidth})
                
                this.setState({sizes, loadingProgress:{total:images.length, loaded}})
            })
            //images[i].load()
        }

        this.setState({loading:loaded === images.length ? false: true})
    }
    handleAllLoaded(){
        
        if(this.props.onLoaded)
            this.props.onLoaded()
        
        this.setState({loading:false})
    }
    render() {
        const { images, langCode,dots} = this.props;
        const { index } = this.state;
        const wrapStyle = {}
        const imageQuality = 'medium';

        return (
            <div
                className="image-carousel-wrap"
                ref={this.handleRef}
            >
                {images.map((image, idx)=>
                    <div 
                        key={'image-' + image._id + '-' + idx} 
                        className={idx === index ? 'image-carousel-item' : 'image-carousel-item-hidden'}
                    >
                        <div className={'image-carousel-image-wrap'} onClick={this.handleGoNext} style={wrapStyle} >
                            <img 
                                className={'image-carousel-image'} 
                                src={image.imageId ? '/api/image/' + image.imageId + '/image/' + imageQuality : image.src}
                                alt=''
                            />
                        </div>
                        {image.labels && image.labels[langCode] &&
                            <div className={'image-carousel-image-label'}>
                                <h3 className={'image-carousel-image-label-text'}>{image.labels[langCode]}</h3>
                            </div>
                        }
                    </div>
                )}
                {dots && images && images.length > 1 &&
                    <div id='image-carousel-dots-wrap'>
                        <div id='image-carousel-dots'>
                            {images.map((i,idx)=>
                                <div 
                                    key={'image-dot-'+i._id + '-' + idx}
                                    className={idx === index ? 'image-carousel-dot-selected' : 'image-carousel-dot'} 
                                    onClick={(e)=>this.handleDotClick(e, idx)}>
                                </div>
                            )}
                        </div>
                    </div>
                }
            </div>
        )
    }
}
export default ImageCarousel