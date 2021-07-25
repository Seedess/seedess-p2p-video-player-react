# Seedess Video Player for Reach

Video Player with 4K video streaming over P2P BitTorrent 

## Install

No releases have been made. Use only for development. 

```sh
git clone https://github.com/Seedess/seedess-p2p-video-player-react.git
cd ./seedess-p2p-video-player-react
npm install
```

## Development 

You can start the react dev server and edit the code

```sh
npm start
```

## Use in your React App

After you have cloned the github repo into a directory such as `seedess-p2p-video-player-react` you can include it in your project as: 

Example for a file `VideoPlayer.js`

```js
import SeedessVideoPlayer from './seedess-p2p-video-player-react'

export const VideoPlayer = ({ url }) => (
  <div className="video-player">
    <SeedessVideoPlayer src="{url}">
  </div>
)
```

