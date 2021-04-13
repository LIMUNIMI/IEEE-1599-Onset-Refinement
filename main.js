function main(){

	const fs = 44100;	// [Hz]
	const n = 10;

	// generating n seconds of random real input signal for STFT
	//var inputReal = randomReals(n*fs);

	// generate n seconds of sound signal for STFT
	// important! to call sample() keep 1 < n < 23
	var inputReal = sample(n);

	// plotting input signal for STFT
	input = document.getElementById('input');
	Plotly.newPlot( input, [{
	x: Array.from({length: inputReal.length}, (_, i) => i + 1),
	y: inputReal }], {
	margin: { t: 0 } } );

	// setting parameters for STFT (parameters used in 'Onset detection revisited', Simon Dixon)
	const windowSize = 2048; 	// [#samples] (46ms)
	const hopSize = 441; 		// [#samples] (10ms, 78.5% overlap)

	res = STFT(inputReal, windowSize, hopSize);
	//console.log(res);

	df = createDetectionFunction(res, windowSize);
	//console.log(df);

	// plotting detection function
	output = document.getElementById('output');
	Plotly.newPlot( output, [{
	x: Array.from({length: df.length}, (_, i) => i + 1),
	y: df }], {
	margin: { t: 0 } } );
}

function randomReals(size) {

	var result = new Array(size);
	for (var i = 0; i < result.length; i++){
		result[i] = Math.random() * 2 - 1;
	}
	return result;
}

function STFT(inputReal, windowSize, hopSize){

	// input signals with length < windowSize are not analyzed
	// input signals with length = windowSize+(hopSize*x) for x>=0 are fully analyzed
	// input signals with length = windowSize+(hopSize*x)+c for x>=0 and 0<c<hopSize have their last c samples not analyzed

	var res = [];
	var i = 0;

	while (i+windowSize <= inputReal.length){

		// computing in-place FFT
		var outputReal = applyWindow(inputReal.slice(i, i+windowSize), hamming);
		var outputImag = new Array(windowSize).fill(0);	// inputImag filled with zeros
		transform(outputReal, outputImag);

		// in outputReal Re[-f] =  Re[f] 	(outputReal is symmetric respect to the element at index windowSize/2)
		// in outputImag Im[-f] = -Im[f]

		// converting output to polar coordinates
		var outputR = [];
		var outputPhi = [];
		for (var j = 0; j < windowSize; j++){
			var complex = math.complex(outputReal[j], outputImag[j]);
		    outputR.push(complex.abs());
		    outputPhi.push(complex.arg());	// phase is in (-pi, pi] range
		}

		res.push([outputR, outputPhi]);
		i += hopSize;
	}

	return res;
}

function createDetectionFunction(s, windowSize){ 

	// target amplitude for a frame corresponds to the magnitude of the previous frame
	// target phase for a frame corresponds to the sum of the previous phase and the phase difference between preceding frames

	var targetAmplitudes = [];
	var targetPhases = [];

	// target amplitude for the 1st frame is set to 0
	targetAmplitudes.push(new Array(windowSize).fill(0));

	// target amplitude for the 2nd frame (it's here only to avoid pushing amplitude and phase values in two separate loops)
	targetAmplitudes.push(s[0][0]);

	// target phase for the 1st and the 2nd frame is set to 0
	targetPhases.push(new Array(windowSize).fill(0));
	targetPhases.push(new Array(windowSize).fill(0));	

	for (var i = 2; i < s.length; i++){
		targetAmplitudes.push(s[i-1][0]);
		targetPhaseValue = math.subtract(math.multiply(2, s[i-1][1]), s[i-2][1]);
		// given a vector x, computing math.atan2(math.sin(x), math.cos(x)) maps the values of x to the range [-pi, pi]
		targetPhases.push(math.atan2(math.sin(targetPhaseValue), math.cos(targetPhaseValue)));
	}

	//console.log(targetAmplitudes);
	//console.log(targetPhases);

	// constructing the detection function
	var detectionFunction = [];
	for (var i = 0; i < s.length; i++){

		var stationarityMeasures = [];
		for (var k = 0; k < windowSize; k++){

			var targetReIm = math.Complex.fromPolar({r: targetAmplitudes[i][k], phi: targetPhases[i][k]});
			var measuredReIm = math.Complex.fromPolar({r: s[i][0][k], phi: s[i][1][k]});

			// measuring Euclidean distance for the kth bin between target and measured vector in the complex space
			stationarityMeasures.push(math.distance([targetReIm.re, measuredReIm.re], [targetReIm.im, measuredReIm.im]));
		}
		detectionFunction.push(math.sum(stationarityMeasures));
	}

	return detectionFunction;
}

main();