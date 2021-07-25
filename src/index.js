import React from 'react'
import { render } from 'react-dom'
import { Router, Route, Switch } from 'react-router'
import { createBrowserHistory } from 'history'
import App from './containers/App'
import PlayerContainer from './containers/Player'
import BroadcasterContainer from './containers/Broadcaster'
import ViewerContainer from './containers/Viewer'
import settings from './settings'
import registerServiceWorker from './registerServiceWorker';

const debug = require('debug')('torrent-video-player:index')

const history = createBrowserHistory()

const route = () => {
  return (
    <Router history={history}>
        <App>
          <Switch>
            <Route exact path="/broadcast/:namespace" component={BroadcasterContainer} />
            <Route exact path="/viewer/:namespace" component={ViewerContainer} />
            <Route path="/*" component={PlayerContainer} />
          </Switch>
        </App>
    </Router>)
}

settings.registerServiceWorker && registerServiceWorker()

render(route(), document.getElementById('root'))

debug('Rendered app')

