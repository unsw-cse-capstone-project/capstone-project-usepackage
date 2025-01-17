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

// The following tests how parseFunction works. 
// runCommand("-i inputfile.wav \"-i\" \"input file.wav\" \"output file.wav\"");

// ReactDOM.render(
// <Container main={<EditorGUI title="Screaming Goat" />}/>,
//   document.getElementById('react-container') 
// )

ReactDOM.render(
  <Container main={<MainContainer />}/>,
  document.getElementById('react-container') 
)

if(module.hot) 
  module.hot.accept() 
