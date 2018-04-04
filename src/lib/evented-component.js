import React from 'react'
import EventEmitter from 'events'

export default class EventedComponent extends React.Component {

  constructor(props) {
    super(props)
    this.Emitter = new EventEmitter()
  }
  
  on(event, callback) {
    return this.Emitter.on(event, callback)
  }
  
  emit(event, params) {
    return this.Emitter.emit(event, params)
  }
}