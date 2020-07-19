/*eslint no-undef: "error"*/
/*eslint-env node*/
import React from 'react'
import ReactDOM from 'react-dom'
import "core-js/stable";
import "regenerator-runtime/runtime";
import Topnav from './js/Topnav.jsx'
import Container from './js/Container.jsx'
import './img/favicon.ico';
import './css/style.css'
import {initWorker} from './js/converter/converter.js' 
import EditorGUI from './js/editor/EditorGUI.jsx'

initWorker();
// The following tests how parseFunction works. 
// runCommand("-i inputfile.wav \"-i\" \"input file.wav\" \"output file.wav\"");

ReactDOM.render(
  <Topnav name="Screaming Goat" />,
  document.getElementById('nav-bar') // eslint-disable-line no-undef
)

ReactDOM.render(
<Container main={<EditorGUI title="Screaming Goat" />}/>,
  document.getElementById('react-container') // eslint-disable-line no-undef
)

if(module.hot) // eslint-disable-line no-undef  
  module.hot.accept() // eslint-disable-line no-undef  

