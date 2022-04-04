/*
 Free FFT and convolution (JavaScript)
 
 Copyright (c) 2020 Project Nayuki. (MIT License)
 https://www.nayuki.io/page/free-small-fft-in-multiple-languages
 
 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the "Software"), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:
 - The above copyright notice and this permission notice shall be included in
   all copies or substantial portions of the Software.
 - The Software is provided "as is", without warranty of any kind, express or
   implied, including but not limited to the warranties of merchantability,
   fitness for a particular purpose and noninfringement. In no event shall the
   authors or copyright holders be liable for any claim, damages or other
   liability, whether in an action of contract, tort or otherwise, arising from,
   out of or in connection with the Software or the use or other dealings in the
   Software.
 */

"use strict";

/* 
 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
 * The vector can have any length. This is a wrapper function.
 */
export const FFT = (real, imag) => {
	let n = real.length;
	if (n != imag.length) 
		throw "Mismatched lengths";
	if (n == 0) 
		return;
	else if ((n & (n - 1)) == 0)  // Is power of 2
		transformRadix2(real, imag);
	else  
		throw "The vector's length must be a power of 2";
}

/* 
 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
 * The vector's length must be a power of 2. Uses the Cooley-Tukey decimation-in-time radix-2 algorithm.
 */
const transformRadix2 = (real, imag) => {

	// Returns the integer whose value is the reverse of the lowest 'width' bits of the integer 'val'.
	const reverseBits = (val, width) => {
		let result = 0;
		for (let i = 0; i < width; i++) {
			result = (result << 1) | (val & 1);
			val >>>= 1;
		}
		return result;
	}
	
	// Length variables
	let n = real.length;
	if (n != imag.length)
		throw "Mismatched lengths";
	if (n == 1)  // Trivial transform
		return;
	let levels = -1;
	for (let i = 0; i < 32; i++) {
		if (1 << i == n)
			levels = i;  // Equal to log2(n)
	}
	if (levels == -1)
		throw "Length is not a power of 2";
	
	// Trigonometric tables
	let cosTable = new Array(n / 2);
	let sinTable = new Array(n / 2);
	for (let i = 0; i < n / 2; i++) {
		cosTable[i] = Math.cos(2 * Math.PI * i / n);
		sinTable[i] = Math.sin(2 * Math.PI * i / n);
	}
	
	// Bit-reversed addressing permutation
	for (let i = 0; i < n; i++) {
		let j = reverseBits(i, levels);
		if (j > i) {
			let temp = real[i];
			real[i] = real[j];
			real[j] = temp;
			temp = imag[i];
			imag[i] = imag[j];
			imag[j] = temp;
		}
	}
	
	// Cooley-Tukey decimation-in-time radix-2 FFT
	for (let size = 2; size <= n; size *= 2) {
		let halfsize = size / 2;
		let tablestep = n / size;
		for (let i = 0; i < n; i += size) {
			for (let j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
				let l = j + halfsize;
				let tpre =  real[l] * cosTable[k] + imag[l] * sinTable[k];
				let tpim = -real[l] * sinTable[k] + imag[l] * cosTable[k];
				real[l] = real[j] - tpre;
				imag[l] = imag[j] - tpim;
				real[j] += tpre;
				imag[j] += tpim;
			}
		}
	}
	
}