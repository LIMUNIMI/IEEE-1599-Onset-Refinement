export const plotData1 = (inputReal, df_complex, df_percussive, df, original_times) => {
	const trace1 = {
	  x: Array.from({length: inputReal.length}, (_, i) => i + 1),
	  y: inputReal,
	  type: 'scatter',
	  name: 'input signal',
	  line: {color: 'rgb(200, 200, 200)'}
	};
	const trace2 = {
	  x: Array.from({length: inputReal.length}, (_, i) => (i + 1) * 441),
	  y: df_complex,
	  type: 'scatter',
	  name: 'complex domain detection',
	  line: {dash: 'dot', color: 'rgb(55, 128, 191)'}
	};
	const trace3 = {
	  x: Array.from({length: inputReal.length}, (_, i) => (i + 1) * 441),
	  y: df_percussive,
	  type: 'scatter',
	  name: 'percussive detection',
	  line: {color: 'rgb(0, 240, 0)'}
	};
	const trace4 = {
	  x: Array.from({length: inputReal.length}, (_, i) => (i + 1) * 441),
	  y: df,
	  type: 'scatter',
	  name: 'global detection',
	  line: {color: 'rgb(255, 0, 0)'}
	};
	const trace5 = {
		x: original_times.map((i) => Math.floor(i * FS)),
		y: original_times.map(() => 0.6),
		width: original_times.map(() => 0.5),
		type: 'bar',
		name: 'original onsets',
		error_x: {
			type: 'data',
			array: original_times.map(() => LIMIT * 2 * FS), // limit * 2 perchè è la distanza massima in anticipo o in ritardo
			visible: true
		},
		marker: {color: 'rgb(0, 0, 255)'}
	};
	const data = [trace1, trace2, trace3, trace4, trace5];
	const layout = {
	  title:'Detection functions with input signal',
	  yaxis: {range: [-1, 1]},
	  paper_bgcolor: 'rgb(243, 241, 236)',
	  plot_bgcolor: 'rgb(243, 241, 236)'
	};
	Plotly.newPlot('result', data, layout);
}

export const plotData2 = (df, threshold) => {
	const trace1 = {
	  x: Array.from({length: df.length}, (_, i) => i + 1),
	  y: df,
	  type: 'scatter',
	  name: 'detection function'
	};
	const trace2 = {
	  x: Array.from({length: threshold.length}, (_, i) => i + 1),
	  y: threshold,
	  type: 'scatter',
	  name: 'threshold',
	  line: {color: 'rgb(255, 0, 0)'}
	};
	const data = [trace1, trace2];
	const layout = {
	  title:'Detection function with adaptive threshold',
	  paper_bgcolor: 'rgb(243, 241, 236)',
	  plot_bgcolor: 'rgb(243, 241, 236)'
	};
	Plotly.newPlot('df_threshold', data, layout);
}

export const plotData3 = (df, peaks) => {
	const trace1 = {
	  x: Array.from({length: df.length}, (_, i) => i + 1),
	  y: df,
	  type: 'scatter',
	  name: 'detection function'
	};
	const trace2 = {
	  x: peaks[0],
	  y: peaks[1],
	  mode: 'markers',
	  line: {color: 'rgb(248, 148, 7)'},
	  type: 'scatter',
	  name: 'onsets'
	};
	const data = [trace1, trace2];
	const layout = {
	  title:'Detection function minus threshold with peaks > 0',
	  paper_bgcolor: 'rgb(243, 241, 236)',
	  plot_bgcolor: 'rgb(243, 241, 236)'
	};
	Plotly.newPlot('df_peaks', data, layout);
}