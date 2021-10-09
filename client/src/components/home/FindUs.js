import React, { Component } from 'react';
import Iframe from 'react-iframe';
//import GoogleMap from './GoogleMap';
import './FindUs.css';

class FindUs extends Component {
	render() {
		return (
			<div id='find-us'>
				<div className='find-us-map-wrap'>
					<Iframe
						width='100%'
						height='450'
						frameBorder='0'
						src='https://www.google.com/maps/embed/v1/place?q=chinemachine&key=AIzaSyBXgTnSLZ0tusCbkzkIBTTGLorP0Z6sXYY'
						allowfullscreen
					/>
				</div>
				<div className='find-us-map-wrap'>
					<Iframe
						width='100%'
						height='450'
						frameBorder='0'
						src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5248.321597250328!2d2.35033342380819!3d48.87421110829127!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e13a43940fb%3A0xed726804d4f3bea9!2sChinemachine+II!5e0!3m2!1sen!2sse!4v1500577143360'
						allowfullscreen
					/>
				</div>
			</div>
		);
	}
}

export default FindUs;
