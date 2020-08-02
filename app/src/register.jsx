import React from 'react'
import ReactDOM from 'react-dom'
import "core-js/stable";
import "regenerator-runtime/runtime";
import Topnav from './js/Topnav.jsx'
import Container from './js/Container.jsx'
import './img/favicon.ico';
import './css/style.css'
import RegisterContainer from './js/reglog/RegisterContainer.jsx'

  
  ReactDOM.render(
    <Container main={<RegisterContainer />} />,
    document.getElementById('react-container') // eslint-disable-line no-undef
  )