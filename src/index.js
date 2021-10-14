import 'react-app-polyfill/stable'
import '@reach/dialog/styles.css'
import './version.js'
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App/logic.js';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();


// not ideal but...
let error = window.console.error;
window.console.error = (...args) => {
  if (/(cannot appear as a descendant of|must have either an)/.test(args[0]))
    return;

  error(...args);
};