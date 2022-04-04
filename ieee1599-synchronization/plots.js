import { FS, WINDOW_SIZE, WINDOW_SIZE_HALF, HOP_SIZE, LIMIT } from "../main.js"

const colorBackgroundPaper = 'rgb(243, 241, 236)'
const colorBackgroundPlot = colorBackgroundPaper
const colorLineAudioSignal = 'rgb(224, 224, 224)'
const colorLineOdfCD = 'rgb(166,86,40)'
const colorLineOdfCDdiff = 'rgb(55,126,184)'
const colorLineThreshold = 'rgb(228,26,28)'
const colorMarkerPeaks = 'rgb(255,127,0)'
const colorLineTappingDeviation = colorLineOdfCDdiff
const colorLineCorrectedTappingDeviation = colorMarkerPeaks
const colorLineTappingDeviation50Ms = colorLineThreshold

const frameIndexesToSampleNumbers = detectionFunctionLength => [...Array(detectionFunctionLength).keys()].map(i => WINDOW_SIZE_HALF + i * HOP_SIZE)

const timesToSampleNumbers = times => times.map(t => Math.floor(t * FS))

export const mainPlot = (audioSignal, odfCD, odfCDdiff, groundTruthTimes, onsetsTapping, onsetsTappingCorrected, allOnsetsFound) => {
	
	let data = [
		{ 
			y: audioSignal, 
			type: 'scatter', 
			name: 'audio signal', 
			line: {color: colorLineAudioSignal} 
		},
		{ 
			x: frameIndexesToSampleNumbers(odfCD.length),
			y: odfCD, 
			visible: "legendonly",
			type: 'scatter', 
			name: 'CD ODF in [-1,1]', 
			line: {color: colorLineOdfCD} 
		},
		{ 
			x: frameIndexesToSampleNumbers(odfCDdiff.length),
			y: odfCDdiff, 
			type: 'scatter', 
			name: 'CD ODF 1st difference in [-1,1]', 
			line: {color: colorLineOdfCDdiff} 
		},
		{
			x: timesToSampleNumbers(onsetsTapping), 
			y: onsetsTapping.map((_, i) => (i % 2 == 0) ? 0.65 : 0.7),
			width: 1,
			type: 'bar',
			name: 'tapping onsets',
			error_x: {
				type: 'data',
				array: onsetsTapping.map(() => LIMIT * FS),
				visible: true
			},
			marker: {color: 'rgb(152,78,163)'}
		},
		{
			x: timesToSampleNumbers(onsetsTappingCorrected),
			y: onsetsTappingCorrected.map(() => 1.1),
			width: 1,
			type: 'bar',
			name: 'tapping onsets correction',
			marker: {color: 'rgb(77,175,74)'}
		},
		{
			x: timesToSampleNumbers(allOnsetsFound),
			y: allOnsetsFound.map(() => -1),
			width: 1,
			visible: "legendonly",
			type: 'bar',
			name: 'all founded peaks',
			marker: {color: 'rgb(247,129,191)'}
		}
	]

	if (groundTruthTimes !== undefined){
		const groundTruthTimesTrace = {
			x: timesToSampleNumbers(groundTruthTimes),
			y: groundTruthTimes.map(() => 1.2),
			width: 1,
			type: 'bar',
			name: 'ground truth onsets',
			marker: {color: 'rgb(228,26,28)'}
		}
		data.splice(3, 0, groundTruthTimesTrace)
	}
	
	const layout = {
	  title:'Audio signal, ODFs and onset times',
	  xaxis: {
	  	showticklabels: false,
	  	title: {
	  		text: ''
	  	}
	  },
	  yaxis: {
	  	range: [-1.2, 1.2],
	  	title: {
	  		text: 'amplitude'
	  	}
	  },
	  barmode: 'overlay',
	  paper_bgcolor: colorBackgroundPaper,
	  plot_bgcolor: colorBackgroundPlot,
	  showlegend: true,
		legend: {"orientation": "h"}
	};

	Plotly.newPlot('result', data, layout);
}

export const thresholdPlot = (odfCDdiff, threshold) => {

	const data = [
		{ 
			y: odfCDdiff, 
			type: 'scatter', 
			name: 'CD ODF 1st difference', 
			line: {color: colorLineOdfCDdiff} 
		},
		{ 
			y: threshold, 
			type: 'scatter', 
			name: 'threshold', 
			line: {color: colorLineThreshold} 
		}
	];

	const layout = {
	  title:'ODF with moving median threshold',
	  xaxis: {
	  	range: [-100, odfCDdiff.length + 100],
	  	showticklabels: false,
	  	showgrid: false,
	  	title: {
	  		text: '# frame'
	  	}
	  },
	  yaxis: {
	  	range: [Math.min(...odfCDdiff) - 0.5, 
	  			Math.max(...odfCDdiff) + 0.5],
	  	showticklabels: false,
	  	showgrid: false,
	  	title: {
	  		text: 'ODF value'
	  	}
	  },
	  showlegend: true,
		legend: {"orientation": "h"},
	  paper_bgcolor: colorBackgroundPaper,
	  plot_bgcolor: colorBackgroundPlot
	};

	Plotly.newPlot('df_threshold', data, layout);
}

export const peaksPlot = (odfCDdiff, peaks) => {

	const data = [
		{ 
			y: odfCDdiff, 
			type: 'scatter', 
			name: 'CD ODF 1st difference', 
			line: {color: colorLineOdfCDdiff} 
		},
		{
		 	x: peaks.map((peak) => peak[0]),
		  	y: peaks.map((peak) => peak[1]),
		  	mode: 'markers',
		  	type: 'scatter',
		  	name: 'peaks',
		  	line: {color: colorMarkerPeaks}
		}
	];
	
	const layout = {
	  title:'Positive peaks of the thresholded ODF',
	  xaxis: {
	  	range: [-100, odfCDdiff.length+100],
	  	showticklabels: false,
	  	showgrid: false,
	  	title: {
	  		text: '# frame'
	  	}
	  },
	  yaxis: {
	  	range: [Math.min(...odfCDdiff) - 0.5, 
	  			Math.max(...odfCDdiff) + 0.5],
	  	showticklabels: false,
	  	showgrid: false,
	  	title: {
	  		text: 'ODF value'
	  	}
	  },
	  showlegend: true,
		legend: {"orientation": "h"},
	  paper_bgcolor: colorBackgroundPaper,
	  plot_bgcolor: colorBackgroundPlot
	};

	Plotly.newPlot('df_peaks', data, layout);
}

export const evaluationPlot = (tapDeviations, correctTapDeviations) => {

	const data = [
		{ 
			x: Array.from({length: tapDeviations.length}, (_, i) => i + 1),
			y: tapDeviations, 
			type: 'bar', 
			name: 'tapping', 
			marker: {color: 'rgb(152,78,163)'} 
		},
		{ 
			x: Array.from({length: correctTapDeviations.length}, (_, i) => i + 1),
			y: correctTapDeviations, 
			type: 'bar', 
			name: 'corrected tapping', 
			marker: {color: 'rgb(77,175,74)'} 
		}
	];

	const layout = {
	  title:'Deviation from ground truth times',
	  xaxis: {
	  	range: [0, tapDeviations.length+1],
	  	showticklabels: false,
	  	title: {
	  		text: '# onset'
	  	}
	  },
	  yaxis: {
	  	range: [Math.min(-0.06, Math.min(...tapDeviations) - 0.01, Math.min(...correctTapDeviations) - 0.01), 
	  			Math.max( 0.06, Math.max(...tapDeviations) + 0.01, Math.max(...correctTapDeviations) + 0.01)],
	  	title: {
	  		text: 'deviation [s]'
	  	}
	  },
	  barmode: 'group',
	  shapes: [
	    {
	      type: 'line',
	      x0: 0.5,
	      y0: 0.05,
	      x1: tapDeviations.length+1,
	      y1: 0.05,
	      line: {
	        color: colorLineTappingDeviation50Ms,
	        width: 1
	      }
	    },
	    {
	      type: 'line',
	      x0: 0.5,
	      y0: -0.05,
	      x1: tapDeviations.length+1,
	      y1: -0.05,
	      line: {
	        color: colorLineTappingDeviation50Ms,
	        width: 1
	      }
	    }
  	  ],
  	showlegend: true,
		legend: {"orientation": "h"},
	  paper_bgcolor: colorBackgroundPaper,
	  plot_bgcolor: colorBackgroundPlot
	};

	Plotly.newPlot('evaluation', data, layout);
}