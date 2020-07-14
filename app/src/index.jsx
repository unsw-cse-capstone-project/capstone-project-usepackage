/*eslint no-undef: "error"*/
/*eslint-env node*/
import React from 'react'
import ReactDOM from 'react-dom'
// Custom react components
import MainContainer from './js/container/container.jsx'

import "core-js/stable";
import "regenerator-runtime/runtime";
import './img/favicon.ico';
import './css/style.css'

ReactDOM.render(
  <MainContainer />,
  document.getElementById('react-container') // eslint-disable-line no-undef
)

if(module.hot) // eslint-disable-line no-undef
  module.hot.accept() // eslint-disable-line no-undef
