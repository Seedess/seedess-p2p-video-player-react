// requires chart.js 
import React from 'react'
const debug = require('debug')('torrent-video-player:Chart')
const Chart = global.Chart

let context, chart

const updateIntervalMs = 1000
const maxDatasetLen = 20
const  chartColors = {
    webSeed: '#e91f62',
    peer: '#03a9f4', 
    default: '#4caf50',
    peer2: '#9c27b0',
    orange: '#f44336',
    gray: '#eeeeee'
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
                text: 'CDN Traffic vs Peer Traffic'
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

export default class ChartComponent extends React.Component {

    updateInterval = null
  
    constructor(props) {
        super()
        debug('render chart', props)
        let peers = []
        props.video.on('torrent', torrent => {
            debug('torrent available', torrent)
            torrent.on('wire', peer => {
                debug('new wire', peer)
                peers.push(peer)
            })
            torrent.on('ready', function() {
                this.updateInterval = setInterval(() => {
                    chart.data.labels.push(parseInt(chart.data.labels[chart.data.labels.length - 1], 10) + 1)
                    if (chart.data.labels.length > maxDatasetLen) {
                        chart.data.labels.shift()
                    }
                    peers.forEach( (peer, i) => {
                        let dataset = chart.data.datasets[i]
                        if (!dataset) {
                            const num = chart.data.datasets.filter(dataset => dataset.peerType == peer.type).length
                            const color = chartColors[Object.keys(chartColors)[i]]
                            dataset = {...datasetDefault}
                            dataset = {
                                ...dataset, 
                                ...{
                                    peerType: peer.type,
                                    label: (peer.type === 'webSeed' ? 'CDN ' : 'Peer ') + (num + 1),
                                    data: [],
                                    borderColor: color,
                                    backgroundColor: color + 10
                                }
                            }
                        }
                        dataset.data.push(peer.downloadSpeed() / 1000)
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
