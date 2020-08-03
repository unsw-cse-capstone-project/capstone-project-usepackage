/*eslint no-undef: "error"*/
/*eslint-env node*/
import React from 'react'
import ReactDOM from 'react-dom'
// Custom react components
import "core-js/stable";
import "regenerator-runtime/runtime";
import './img/favicon.ico';
import './css/style.css' 
import Container from './js/Container.jsx'
import MainContainer from './js/container/editor.jsx'

ReactDOM.render(
  <Container main={<MainContainer />}/>,
  document.getElementById('react-container') 
)

if(module.hot) 
  module.hot.accept() 
