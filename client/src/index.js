import React from 'react';
import ReactDOM from 'react-dom';
import packageJson from '../package.json'
import './index.css';
import App from './App';

console.log('Version:', packageJson.version)

ReactDOM.render(
    <React.Fragment>
   		<App/>
  	</React.Fragment>,
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
//serviceWorker.register();
