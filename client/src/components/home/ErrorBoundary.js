import React, { Component } from 'react';

class ErrorBoundary extends Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false };
	}
	static getDerivedStateFromError(error) {
		// Update state so the next render will show the fallback UI.    return { hasError: true };
		console.log(error);
	}
	componentDidCatch(error, errorInfo) {
		// You can also log the error to an error reporting service    logErrorToMyService(error, errorInfo);
		console.log(error, errorInfo);
	}
	render() {
		if (this.state.hasError) return <h1>Something went wrong.</h1>;
		return this.props.children;
	}
}
export default ErrorBoundary;
