import { FS, WINDOW_SIZE, WINDOW_SIZE_HALF, HOP_SIZE, LIMIT } from "../../main.js"
import { hammingWindow, getModulus, getPhase } from "./math-utils.js"
import { FFT } from "./nayuki-fft.js"

export const STFT = monoSignal => {

	// input signals with length < windowSize are not analyzed
	// input signals with length = windowSize+(hopSize*x) for x>=0 are fully analyzed
	// input signals with length = windowSize+(hopSize*x)+c for x>=0 and 0<c<hopSize have their last c samples not analyzed

	let frames = [];
	let i = 0;
	const zerosArray = new Array(WINDOW_SIZE).fill(0);
	const len = monoSignal.length;

	while (i+WINDOW_SIZE <= len){

		// computing in-place FFT
		let outputReal = hammingWindow(monoSignal.slice(i, i+WINDOW_SIZE));
		let outputImag = zerosArray.slice();	// inputImag filled with zeros
		
		FFT(outputReal, outputImag);

		// in outputReal Re[-f] =  Re[f] 	(outputReal is symmetric respect to the element at index windowSize/2)
		// in outputImag Im[-f] = -Im[f]

		// converting output to polar coordinates
		let outputR = []
		let outputPhi = []
		for (let j = 0; j < WINDOW_SIZE; j++){
		    outputR[j] = getModulus(outputReal[j], outputImag[j]);
			outputPhi[j] = getPhase(outputReal[j], outputImag[j]);
		}

		frames.push([outputR, outputPhi]);
		i += HOP_SIZE;
	}
	return frames;
}