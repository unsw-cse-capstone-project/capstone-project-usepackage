import React from 'react'
import ReactDOM from 'react-dom'
import "core-js/stable";
import "regenerator-runtime/runtime";
import Topnav from './js/Topnav.jsx'
import Container from './js/Container.jsx'
import './img/favicon.ico';
import './css/style.css'
import Profile from './js/reglog/Profile.jsx'

ReactDOM.render(
    <Topnav name="Screaming Goat" />,
    document.getElementById('nav-bar') // eslint-disable-line no-undef
  )
  
ReactDOM.render(
<Container main={<Profile />} />,
document.getElementById('react-container') 
) // eslint-disable-line no-undef