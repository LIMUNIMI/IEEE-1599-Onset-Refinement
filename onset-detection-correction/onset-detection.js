//import { plotData1 } from "./plots.js"
import { fetchXMLOnsets } from "./utilsXML.js"

export const onsetDetection = inputReal => {

	console.info('... computing STFT');
	let res = STFT(inputReal);

	console.info('... computing complex domain detection function');
	let df_complex = createDetectionFunction(res);

	console.info('... computing percussive feature detection function');
	let df_percussive = percussiveFeatureDetection(res);

	// normalizing detection functions normalized in range [0,1]
	df_complex = scale(1/max(df_complex), df_complex);
	df_percussive = scale(1/max(df_percussive), df_percussive);

	console.info('... computing global detection function');
	const weight = PARAMS.weights[SIGNAL_TYPE];
	let df = add(scale(weight, df_complex), scale((1-weight), df_percussive));

	// prendo onset dall'XML
	const d = new IEEE1599Document(XML_FILE_NAME);
    const originalTimes = fetchXMLOnsets(d);

	//plotData1(inputReal, df_complex, df_percussive, df, originalTimes);
	return df
}

const STFT = inputReal => {

	// input signals with length < windowSize are not analyzed
	// input signals with length = windowSize+(hopSize*x) for x>=0 are fully analyzed
	// input signals with length = windowSize+(hopSize*x)+c for x>=0 and 0<c<hopSize have their last c samples not analyzed

	let res = [];
	let i = 0;
	const zerosArray = new Array(WINDOW_SIZE).fill(0);
	const len = inputReal.length;

	while (i+WINDOW_SIZE <= len){

		// computing in-place FFT
		let outputReal = applyWindow(inputReal.slice(i, i+WINDOW_SIZE), hamming);
		let outputImag = zerosArray.slice();	// inputImag filled with zeros
		transform(outputReal, outputImag);

		// in outputReal Re[-f] =  Re[f] 	(outputReal is symmetric respect to the element at index windowSize/2)
		// in outputImag Im[-f] = -Im[f]
		// using only the positive side of the spectrum makes the detection function sharper and reduces the computational time significantly
		outputReal = outputReal.slice(WINDOW_SIZE/2, WINDOW_SIZE);
		outputImag = outputImag.slice(WINDOW_SIZE/2, WINDOW_SIZE);

		// converting output to polar coordinates
		let outputR = new Array(WINDOW_SIZE/2);
		let outputPhi = new Array(WINDOW_SIZE/2);
		for (let j = 0; j < WINDOW_SIZE/2; j++){
		    outputR[j] = getModulus(outputReal[j], outputImag[j]);
			outputPhi[j] = getPhase(outputReal[j], outputImag[j]);
		}

		res.push([outputR, outputPhi]);
		i += HOP_SIZE;
	}
	return res;
}

const createDetectionFunction = s => { 

	let targetAmplitudes = [];
	let targetPhases = [];
	const zerosArray = new Array(WINDOW_SIZE/2).fill(0);

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
	for (let i = 2; i < len; i++){

		targetAmplitudes.push(s[i-1][0]); 
		let targetPhaseValue = subtract(scale(2, s[i-1][1]), s[i-2][1]);
		// given a vector x, computing math.atan2(math.sin(x), math.cos(x)) maps the values of x to the range [-pi, pi]
		let mapped = new Array(targetPhaseValue.length);
		for (let i=0, len=targetPhaseValue.length; i < len; i++)
			mapped[i] = Math.atan2(Math.sin(targetPhaseValue[i]), Math.cos(targetPhaseValue[i]));
		targetPhases.push(mapped);
	}

	// constructing the detection function
	let detectionFunction = [];
	let targetRe = 0, measuredRe = 0, targetIm = 0, measuredIm = 0, stationarityMeasure = 0;
	for (let i = 0; i < len; i++){
		stationarityMeasure = 0;
		for (let k = 0; k < WINDOW_SIZE/2; k++){
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

const percussiveFeatureDetection = s => { 

	let percussiveMeasure = [0]; 					// percussive measure for the first frame is set to 0
	const T = PARAMS.threshold[SIGNAL_TYPE];		// threshold (rise in energy [dB] which must be detected to say that the frequency bin is percussive)
	let count = 0;
	for (let i = 1, len = s.length; i < len; i++){
		count = 0;
		for (let j = 0; j < WINDOW_SIZE/2; j++){
			if (20 * Math.log10(s[i-1][0][j] / s[i][0][j]) > T)
				count += 1;
		}
		percussiveMeasure.push(count);
	}
	return percussiveMeasure;
}