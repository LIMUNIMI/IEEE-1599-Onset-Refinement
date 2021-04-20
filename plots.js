function plotData(inputReal, df){
	var trace1 = {
	  x: Array.from({length: inputReal.length}, (_, i) => i + 1),
	  y: inputReal,
	  type: 'scatter',
	  name: 'input signal'
	};
	var trace2 = {
	  x: Array.from({length: inputReal.length}, (_, i) => (i + 1)*441),
	  y: df,
	  type: 'scatter',
	  name: 'detection function'
	};
	var data = [trace1, trace2];
	var layout = {
	  title:'Results',
	  yaxis: {range: [-1, 1]}
	};
	Plotly.newPlot('result', data, layout);
}