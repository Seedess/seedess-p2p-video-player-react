// requires chart.js 
import React from 'react'
import { getPeerType, getPeerById, getPeerWire, getPeers } from '../lib/webtorrent'
const debug = require('debug')('torrent-video-player:PieChart')
const Chart = global.Chart

let context, chart

const updateIntervalMs = 2000

const data = {
    labels: [
        "CDN",
        "Peers",
        "BitTorrent"
    ],
    datasets: [
        {
            data: [100, 0, 0],
            backgroundColor: [
                "#03a9f4",
                "#e91f62",
                "#4caf50"
            ]
        }
    ]
}
const peerTypes = [
    "webSeed",
    "webrtc",
    "bitTorrent"
]

const chartRef = (ref) =>  {
  if (ref) {
    debug('loaded chart ref', ref)
    context = ref.getContext('2d')
    loadChart(context)
  }
}

const loadChart = (context) => {
    debug('loading chart')
    const config = {
        type: 'doughnut',
        data: data,
        options: {
        title: {
            display: true,
            text: 'Total Bandwidth'
        },
          segmentShowStroke : true,
          segmentStrokeColor : "#fff",
          segmentStrokeWidth : 2,
          percentageInnerCutout : 50,
          animationSteps : 100,
          animationEasing : "easeOutBounce",
          animateRotate : true,
          animateScale : false,
          responsive: true,
          maintainAspectRatio: true,
          showScale: true
        }
    }
    chart = new Chart(context, config)
}

let updateChartInterval
const updateChartInit = (torrent) => {
    debug('updateChartInit', chart, torrent)
    const updateChart = () => {
        const peers = getPeers(torrent)
        debug('updateChart', chart, peers)
        const data = chart.data.datasets[0].data.map( (value, i) => {
            const peerType = peerTypes[i]
            const peersOfSameType = peers
                .filter(peer => getPeerType(peer) === peerType)
            const totalDownload =  peersOfSameType
                .reduce( (downloaded, peer) => {
                    const wire = getPeerWire(torrent, peer)
                    return downloaded + ((wire && wire.downloaded) || peer.downloaded || 0)
                }, 0)
            debug('type, same, total', peerType, peersOfSameType, totalDownload)
            return totalDownload
        })
        chart.data.datasets[0].data = data
        debug('download data', data)
        chart.update()
    }

    clearInterval(updateChartInterval)
    updateChartInterval = setInterval(() => updateChart(), updateIntervalMs)
}

export default class ChartComponent extends React.Component {

    updateInterval = null
  
    constructor(props) {
        super()
        debug('render chart', props)
        let peers = []
        let wires = []
        props.video.on('torrent', torrent => {
            debug('torrent available', torrent)
            torrent.on('peer', (id) => {
                const peer = getPeerById(torrent, id)
                debug('new peer', id, peer)
                peers.push(peer)
            })
            torrent.on('wire', (wire) => {
                debug('new wire', wire)
                wires.push(wire)
            })
            torrent.on('ready', () => {
              updateChartInit(torrent, peers)
            })
        })
    }

    render() {
        return (<div className="chart chart-doughnut">
            <canvas ref={chartRef}></canvas>
        </div>)
    }
}
