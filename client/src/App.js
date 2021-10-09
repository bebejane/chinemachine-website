import React, { Component, Suspense, lazy } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Loader from './components/util/Loader';

const Home = lazy(() => import('./components/home'));
const Appointment = lazy(() => import('./components/appointment'));
const Verification = lazy(() => import('./components/verification'));
const Dashboard = lazy(() => import('./components/dashboard'));
const Account = lazy(() => import('./components/account'));
const Test = lazy(() => import('./components/test'));
const Slotty = lazy(() => import('./components/slotty'));

const defaultLangCode = 'en';

class App extends Component {
	render() {
		return (
			<Router>
				<Suspense fallback={<Loader message={''} />}>
					<Switch>
						<Route exact path={'/'} component={(props) => <Home {...props} />} />
						<Route exact path={'/en'} component={(props) => <Home {...props} langCode={'en'} />} />
						<Route exact path={'/fr'} component={(props) => <Home {...props} langCode={'fr'} />} />
						<Route path={'/dashboard'} component={(props) => <Dashboard {...props} langCode={defaultLangCode} />} />
						<Route path={'/appointment'} component={Appointment} />
						<Route path={'/account'} component={Account} />
						<Route path={'/verification'} component={Verification} />
						<Route path={'/test'} component={Test} />
						<Route path={'/slotty'} component={Slotty} />
					</Switch>
				</Suspense>
			</Router>
		);
	}
}
export default App;
