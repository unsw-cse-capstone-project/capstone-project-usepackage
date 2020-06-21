import React from 'react'
import ReactDOM from 'react-dom'
import Navbar from './js/Topnav'
import Container from './js/Container'
import './img/favicon.ico';

import './css/style.css'

ReactDOM.render(
  <Navbar name="Screaming Goat" />,
  document.getElementById('nav-bar') // eslint-disable-line no-undef
)

ReactDOM.render(
  <Container />,
  document.getElementById('react-container') // eslint-disable-line no-undef
)

if(module.hot) // eslint-disable-line no-undef  
  module.hot.accept() // eslint-disable-line no-undef  

