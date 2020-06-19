import React, { Component } from 'react';
import ReactDOM from 'react-dom';

class Greeting extends React.Component {
  render() {
    return (
        <h1>Hello, {this.props.name}</h1>
    );
  }
}

ReactDOM.render(<Greeting name="You" />, document.getElementById('app'));
