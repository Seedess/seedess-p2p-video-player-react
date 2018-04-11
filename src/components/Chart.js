// requires chart.js 
import React from 'react'
import { getPeerType, getPeerById, getPeerWire } from '../lib/webtorrent'
const debug = require('debug')('torrent-video-player:Chart')
const Chart = global.Chart

let context, chart

const updateIntervalMs = 1000
const maxDatasetLen = 20
const  chartColors = {
    webSeed: '#03a9f4',
    webrtc: '#e91f62', 
    bitTorrent: '#4caf50',
    default: '#9c27b0',
    orange: '#f44336',
    gray: '#cccccc',
    black: '#000000'
}
const datasetDefault = {
    label: 'Peer',
    data: [],
    borderColor: chartColors.red,
    backgroundColor: chartColors.red + 10,
    fill: true,
    cubicInterpolationMode: 'monotone',
}

const chartRef = (ref) =>  {
  if (ref) {
    debug('loaded chart ref', ref)
    context = ref.getContext('2d')
    loadChart(context)
  }
}

const loadChart = (context) => {
    const config = {
        type: 'line',
        data: {
            labels: [0],
            datasets: []
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: 'Live Traffic'
            },
            tooltips: {
                mode: 'index'
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Time in Seconds'
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Speed in Kbps'
                    },
                    ticks: {
                        suggestedMin: 0,
                        suggestedMax: 10,
                    }
                }]
            }
        }
    }
    chart = new Chart(context, config)
    
}

const peerTypes = {
    'webSeed': 'CDN',
    'webrtc': 'Peer',
    'bitTorrent': 'BitTorrent'
}

const getPeerColor = (peer) => {
    return chartColors[getPeerType(peer)] || chartColors.default
}

const getPeerLabel = (peer, num) => {
    const type = getPeerType(peer)
    return peerTypes[type] + ' ' + (num + 1)
}

export default class ChartComponent extends React.Component {

    updateInterval = null
  
    constructor(props) {
        super()
        debug('render chart', props)
        let peers = []
        props.video.on('torrent', torrent => {
            debug('torrent available', torrent)
            torrent.on('peer', (id) => {
                const peer = getPeerById(torrent, id)
                debug('new peer', id, peer)
                peers.push(peer)
            })
            torrent.on('ready', function() {
                this.updateInterval = setInterval(() => {
                    chart.data.labels.push(parseInt(chart.data.labels[chart.data.labels.length - 1], 10) + 1)
                    if (chart.data.labels.length > maxDatasetLen) {
                        chart.data.labels.shift()
                    }
                    peers.forEach( (peer, i) => {
                        if (!peer.connected || !peer.wire || !peer.conn) return
                        let dataset = chart.data.datasets[i]
                        if (!dataset) {
                            const num = chart.data.datasets.filter(dataset => {
                                return dataset.peerType === getPeerType(peer)
                            }).length
                            const color = getPeerColor(peer)
                            dataset = {...datasetDefault}
                            dataset = {
                                ...dataset, 
                                ...{
                                    peerType: getPeerType(peer),
                                    label: getPeerLabel(peer, num),
                                    data: [],
                                    borderColor: color,
                                    backgroundColor: color + 10
                                }
                            }
                        }
                        dataset.data.push(peer.wire.downloadSpeed() / 1000)
                        if (dataset.data.length > maxDatasetLen) {
                            dataset.data.shift()
                        }
                        chart.data.datasets[i] = dataset
                    })
                    chart.update()
                }, updateIntervalMs)
            })
        })
    }

    render() {
        return (<div className="chart">
            <canvas {...this.props} ref={chartRef}></canvas>
        </div>)
    }
}
