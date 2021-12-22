import { plotData2, plotData3 } from "./plots.js"

let prec, current, v
let df, threshold, sliderListenerAdded = false

export const peakPicking = (df_input) => {

	prec = 0, current = null, v = null

	// subtracting the mean and dividing by the maximum absolute deviation the detection function
	let mean = avg(df_input);
	const maximumAbsoluteDeviation = maxAD(df_input, mean);

	df = scale(1/maximumAbsoluteDeviation, subtractC(mean, df_input));

	// low-pass filtering (to do?)

	// thresholding df with moving-median

	const lambda = 1;		// is set to 1 as it is not critical for the detection
	const m = 20;			// windowSize of the median filter, is set to the longest time interval on which the global dinamics are not expected to evolve (around 100ms)
							// !! l'ho messo a 20 perchè: hopSize fra frame è circa di 10ms, per avere una windowSize che consideri 100ms avanti e 100ms indietro devo metterla di 20 frame

	threshold = scale(lambda, movingMedian(df, m));
	
	moveSlider(df, threshold)

	slider_p.style.display = "block";

	if (!sliderListenerAdded){
		slider.addEventListener("input", moveSlider);
		sliderListenerAdded = true
	}
}

export const moveSlider = () => {

	v = slider.value / 100
  	slider_value.innerHTML = v
  	current = v

  	if (current > prec) threshold = addC(current-prec, threshold) 			//threshold = threshold.map((x) => x + (current-prec) )
  	else if (current < prec) threshold = subtractC(prec-current, threshold)	//threshold = threshold.map((x) => x - (prec-current))
  	prec = v

	
	plotData2(df, threshold);	// plot df with threshold

	const df_copy = subtract(df.slice(), threshold); // subtracting threshold from the normalized detection function

	// finding positive peaks of df (local maximums)
	const frameTime = (1/FS) * (WINDOW_SIZE/2) 
    const offsetTime = (1/FS) * HOP_SIZE;
    let times = [];
    let peaks = [[],[]];	

	for (let i = 1, len = df.length; i < len-1; i++) {
		if (df_copy[i] >= 0 && df_copy[i-1] < df_copy[i] && df_copy[i] > df_copy[i+1]) {
			peaks[0].push(i)			// peak index
			peaks[1].push(df_copy[i])	// peak value
			times.push(parseFloat((frameTime + offsetTime * i).toFixed(2)));
		}
	}

	plotData3(df_copy, peaks);	// plot df minus threshold with peaks > 0

	return times
}