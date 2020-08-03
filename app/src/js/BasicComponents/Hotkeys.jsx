import React from 'react'
import {hotkeys} from 'react-keyboard-shortcuts'
 
class Hotkeys extends React.PureComponent {
    // A set of hotkeys
  constructor(props){
      super(props);
      this.hot_keys = {
        'ctrl+z': {
            priority: 1,
            handler: (event) => this.props.undoHandler(),
        },
        'command+z': {
            priority: 1,
            handler: (event) => this.props.undoHandler(),
        },
        'ctrl+shift+z': {
            priority: 1,
            handler: (event) => this.props.redohandler(),
        },
        'command+shift+z': {
            priority: 1,
            handler: (event) => this.props.redohandler(),
        },
        'ctrl+y': {
          priority: 1,
          handler: (event) => this.props.redohandler(),
        },
        'command+y': {
            priority: 1,
            handler: (event) => this.props.redohandler(),
        },
        'space': {
            priority: 1,
            handler: (event) => this.props.spacehandler(),
        },
      }
  }
 
  render () {
    return (
      <button undoHandler={this.props.undoHandler} redohandler={this.props.redoHandler} spacehandler={this.props.spacehandler} hidden> Undo</button>
    )
  }
}

export default hotkeys(Hotkeys)
