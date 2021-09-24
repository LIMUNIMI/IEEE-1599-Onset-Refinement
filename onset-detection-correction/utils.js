stereo2mono = (dx, sx) => {
	const len = dx.length;
	let mono = new Array(len);
	for (let i = 0; i < len; i++)
		mono[i] = (dx[i] + sx[i]) / 2;
	return mono;
}

trimSilence = signal => {
	let i = 1;
	const len = signal.length;
	while (signal[len - i] == 0)
		i++;
	return signal.slice(0, -i);
}

//------------------- my math utils

// log10 elementi in array
log10 = arr => {
	const len = arr.length;
	let res = new Array(len);
	for (let i = 0; i < len; i++)
		res[i] = Math.log10(arr[i]);
	return res;
}

// somma due array elemento per elemento
add = (arr1, arr2) => {
	const len = arr1.length;
	if (len != arr2.length) throw "different sizes";
	let res = new Array(len);
	for (let i = 0; i < len; i++)
		res[i] = arr1[i] + arr2[i];
	return res;
}

// sottrae due array elemento per elemento
subtract = (arr1, arr2) => {
	const len = arr1.length;
	if (len != arr2.length) throw "different sizes";
	let res = new Array(len);
	for (let i = 0; i < len; i++)
		res[i] = arr1[i] - arr2[i];
	return res;
}

// moltiplica due array elemento per elemento
dotMultiply = (arr1, arr2) => {
	const len = arr1.length;
	if (len != arr2.length) throw "different sizes";
	let res = new Array(len);
	for (let i = 0; i < len; i++)
		res[i] = arr1[i] * arr2[i];
	return res;
}

// divide due array elemento per elemento
dotDivide = (arr1, arr2) => {
	const len = arr1.length;
	if (len != arr2.length) throw "different sizes";
	let res = new Array(len);
	for (let i = 0; i < len; i++)
		res[i] = arr1[i] / arr2[i];
	return res;
}

// moltiplica elementi array per uno scalare k
scale = (k, arr) => {
	const len = arr.length;
	let res = new Array(len);
	for (let i = 0; i < len; i++)
		res[i] = k * arr[i];
	return res;
}

// somma una costante c agli elementi array
addC = (c, arr) => {
	const len = arr.length;
	let res = new Array(len);
	for (let i = 0; i < len; i++)
		res[i] = c + arr[i];
	return res;
}

// sottrae una costante c agli elementi array
subtractC = (c, arr) => addC(-c, arr);

//distanza euclidea fra due punti
euclideanDistance = (x1, y1, x2, y2) => ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5;

// media elementi in array
avg = arr => sum(arr) / arr.length;

// massimo elemento in array 
max = arr => {
	let max = -Infinity;
	for (let i = 0, len = arr.length; i < len; i++)
		if (arr[i] > max)
			max = arr[i];
	return max;
}

// minimo elemento in array
min = arr => {
	let min = +Infinity;
	for (let i = 0, len = arr.length; i < len; i++)
		if (arr[i] < min)
			min = arr[i];
	return min;
}

// somma elementi in array
sum = arr => {
	let sum = 0;
	for (let i = 0, len = arr.length; i < len; i++)
		sum += arr[i];
	return sum;
}

/*
// cos elementi in array
cos = arr => {
	const len = arr.length;
	let res = new Array(len);
	for (let i=0; i < len; i++)
		res[i] = Math.cos(arr[i]);
	return res;
}

// sin elementi in array
sin = arr => {
	const len = arr.length;
	let res = new Array(len);
	for (let i=0; i < len; i++)
		res[i] = Math.sin(arr[i]);
	return res;
}

// atan2
atan2 = (y, x) => {
	const len = y.length;
	if (len != x.length) throw "different sizes";
	let res = new Array(len);
	for (let i=0; i < len; i++)
		res[i] = Math.atan2(y[i], x[i]);
	return res;
}
*/

// modulo di un numero complesso
getModulus = (real, imag) => (real ** 2 + imag ** 2) ** 0.5;

// fase di un numero complesso
getPhase = (real, imag) => {
	if (real == 0)
		return 0;
	let phase = Math.atan(imag / real);
	if (real < 0)
		phase = (phase + Math.PI) % Math.PI;
	return phase;
}

// maximum absolute deviation
maxAD = (arr, mean) => {
	let maximumAbsoluteDeviation = 0, deviation = 0;
	for (let i = 0, len = arr.length; i < len; i++) {
		deviation = Math.abs(arr[i] - mean);
		if (deviation > maximumAbsoluteDeviation)
			maximumAbsoluteDeviation = deviation;
	}
	return maximumAbsoluteDeviation;
}