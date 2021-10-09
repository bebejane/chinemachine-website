import React, { Component } from 'react';
import { Map, GoogleApiWrapper } from 'google-maps-react';

const mapStyles = {
	width: '100%',
	height: '100%',
};

export class GoogleMap extends Component {
	render() {
		return (
			<Map google={this.props.google} zoom={this.props.zoom} style={mapStyles} initialCenter={this.props.center} />
		);
	}
}
export default GoogleApiWrapper({
	apiKey: 'AIzaSyCRgURIV40Gf_bazi40Hc3jjuLAP-l1a-U',
})(GoogleMap);
