import React from 'react'
import ReactDOM from 'react-dom'
import "core-js/stable";
import "regenerator-runtime/runtime";
import Container from './js/Container.jsx'
import './img/favicon.ico';
import './css/style.css'
import LoginContainer from './js/reglog/LoginContainer.jsx'
  
ReactDOM.render(
<Container main={<LoginContainer />} />,
document.getElementById('react-container') // eslint-disable-line no-undef
)