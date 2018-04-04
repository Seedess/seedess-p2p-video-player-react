import React from 'react'
import EventedComponent from '../lib/evented-component'

export default class App extends EventedComponent {

  render() {
    return (<div id="video-player-container">
        {this.props.children}
      </div>)
  }
}
