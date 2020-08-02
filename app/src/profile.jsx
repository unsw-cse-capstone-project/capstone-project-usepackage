/*eslint no-undef: "error"*/
/*eslint-env node*/
import React from 'react'
import ReactDOM from 'react-dom'
// Custom react components
import "core-js/stable";
import "regenerator-runtime/runtime";
import './img/favicon.ico';
import './css/style.css' 
import Topnav from './js/Topnav.jsx'
import Container from './js/Container.jsx'
import Profile from './js/reglog/Profile.jsx'
  
ReactDOM.render(
<Container main={<Profile />} />,
document.getElementById('react-container') 
) // eslint-disable-line no-undef

if(module.hot) 
  module.hot.accept() 