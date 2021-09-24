// setting parameters for STFT (parameters used in 'Onset detection revisited', Simon Dixon)
const windowSize = 2048; 	// [#samples] (46ms)
const hopSize = 441; 		// [#samples] (10ms, 78.5% overlap)

onsetDetection = inputReal => {

	console.log('... computing STFT');
	let res = STFT(inputReal);

	console.info('... computing complex domain detection function');
	let df = createDetectionFunction(res);

	console.info('... computing percussive feature detection function');
	let percussiveFeature = percussiveFeatureDetection(res);
	//plotData1(inputReal, scale(1/max(df), df), scale(1/max(percussiveFeature), percussiveFeature)); // plotting results with detection functions normalized in range [0,1]

	console.info('... computing global detection function');
	// normalizzo fra le due funzioni fra 0 e 1 e le sommo
	df = add(scale(1 / max(df), df), scale(1 / max(percussiveFeature), percussiveFeature));

	console.info('... computing peak picking and onset times');
	onsetTimes = peakPicking(df);

	//document.getElementById("info").innerHTML += "Execution time: " + (performance.now() - t0) + " ms <br>";
	return onsetTimes;
}

STFT = inputReal => {

	// input signals with length < windowSize are not analyzed
	// input signals with length = windowSize+(hopSize*x) for x>=0 are fully analyzed
	// input signals with length = windowSize+(hopSize*x)+c for x>=0 and 0<c<hopSize have their last c samples not analyzed

	let res = [];
	let i = 0;
	const zerosArray = new Array(windowSize).fill(0);
	const len = inputReal.length;

	while (i + windowSize <= len) {

		// computing in-place FFT
		let outputReal = applyWindow(inputReal.slice(i, i + windowSize), hamming);
		let outputImag = zerosArray.slice();	// inputImag filled with zeros
		transform(outputReal, outputImag);

		// in outputReal Re[-f] =  Re[f] 	(outputReal is symmetric respect to the element at index windowSize/2)
		// in outputImag Im[-f] = -Im[f]
		// using only the positive side of the spectrum makes the detection function sharper and reduces the computational time significantly
		outputReal = outputReal.slice(windowSize / 2, windowSize);
		outputImag = outputImag.slice(windowSize / 2, windowSize);

		// converting output to polar coordinates
		let outputR = new Array(windowSize / 2);
		let outputPhi = new Array(windowSize / 2);
		for (let j = 0; j < windowSize / 2; j++) {
			outputR[j] = getModulus(outputReal[j], outputImag[j]);
			outputPhi[j] = getPhase(outputReal[j], outputImag[j]);
		}

		res.push([outputR, outputPhi]);
		i += hopSize;
	}
	return res;
}

createDetectionFunction = s => {

	let targetAmplitudes = [];
	let targetPhases = [];
	const zerosArray = new Array(windowSize / 2).fill(0);

	// target amplitude for a frame corresponds to the magnitude of the previous frame
	// target phase for a frame corresponds to the sum of the previous phase and the phase difference between preceding frames

	// target amplitude for the 1st frame is set to 0
	targetAmplitudes.push(zerosArray.slice());
	// target amplitude for the 2nd frame (it's here only to avoid pushing amplitude and phase values in two separate loops)
	targetAmplitudes.push(s[0][0]);

	// target phase for the 1st and the 2nd frame is set to 0
	targetPhases.push(zerosArray.slice());
	targetPhases.push(zerosArray.slice());

	const len = s.length;
	for (let i = 2; i < len; i++) {

		targetAmplitudes.push(s[i - 1][0]);
		targetPhaseValue = subtract(scale(2, s[i - 1][1]), s[i - 2][1]);
		// given a vector x, computing math.atan2(math.sin(x), math.cos(x)) maps the values of x to the range [-pi, pi]
		//targetPhases.push(atan2(sin(targetPhaseValue), cos(targetPhaseValue)));
		let mapped = new Array(targetPhaseValue.length);
		for (let i = 0, len = targetPhaseValue.length; i < len; i++)
			mapped[i] = Math.atan2(Math.sin(targetPhaseValue[i]), Math.cos(targetPhaseValue[i]));
		targetPhases.push(mapped);
	}

	// constructing the detection function
	let detectionFunction = [];
	let targetRe = 0, measuredRe = 0, targetIm = 0, measuredIm = 0, stationarityMeasure = 0;
	for (let i = 0; i < len; i++) {
		stationarityMeasure = 0;
		for (let k = 0; k < windowSize / 2; k++) {
			targetRe = targetAmplitudes[i][k] * Math.cos(targetPhases[i][k]);
			targetIm = targetAmplitudes[i][k] * Math.sin(targetPhases[i][k]);
			measuredRe = s[i][0][k] * Math.cos(s[i][1][k]);
			measuredIm = s[i][0][k] * Math.sin(s[i][1][k]);
			// measuring Euclidean distance for the kth bin between target and measured vector in the complex space
			stationarityMeasure += euclideanDistance(targetRe, measuredRe, targetIm, measuredIm);
		}
		detectionFunction.push(stationarityMeasure);
	}

	return detectionFunction;
}

percussiveFeatureDetection = s => {

	let percussiveMeasure = [0]; 	// percussive measure for the first frame is set to 0
	const T = 22;					// threshold (rise in energy [dB] which must be detected to say that the frequency bin is percussive)
	let count = 0;
	for (let i = 1, len = s.length; i < len; i++) {
		count = 0;
		for (let j = 0; j < windowSize / 2; j++) {
			if (20 * Math.log10(s[i - 1][0][j] / s[i][0][j]) > T)
				count += 1;
		}
		percussiveMeasure.push(count);
	}
	return percussiveMeasure;
}


peakPicking = df => {

	// subtracting the mean and dividing by the maximum absolute deviation the detection function
	let mean = avg(df);
	let maximumAbsoluteDeviation = maxAD(df, mean);

	df = scale(1 / maximumAbsoluteDeviation, subtractC(mean, df));

	// low-pass filtering (to do)

	// thresholding df with moving-median 
	// values of delta in 'On the Use of Phase and Energy for Musical Onset Detection in the Complex Domain':
	// delta = 0.34 for np_p, = 4.58 for p_np, = 5.95 for p_p, = 5.79 for cm	
	const delta = 0.1;
	const lambda = 1;		// is set to 1 as it is not critical for the detection
	const m = 20;			// ?come lo imposto? windowSize of the median filter, is set to the longest time interval on which the global dinamics are not expected to evolve (around 100ms)

	const threshold = addC(delta, scale(lambda, movingMedian(df, m)));
	//plotData2(df, threshold);	// plot df with threshold

	df = subtract(df, threshold); // subtracting threshold from the normalized detection function

	// finding positive peaks of df (local maximums)
	//let peaks = [[],[]];	
	const timeFrame1 = (1 / fs) * (windowSize / 2);
	const timeOffset = (1 / fs) * hopSize;
	let onsetTimes = [];
	for (let i = 1, len = df.length; i < len - 1; i++) {
		if (df[i] >= 0 && df[i - 1] < df[i] && df[i] > df[i + 1]) {
			//peaks[0].push(i);		// peak index
			//peaks[1].push(df[i]);	// peak value
			onsetTimes.push(parseFloat((timeFrame1 + timeOffset * i).toFixed(2)));
		}
	}
	//plotData3(df, peaks);	// plot df minus threshold with peaks > 0
	return onsetTimes;
}