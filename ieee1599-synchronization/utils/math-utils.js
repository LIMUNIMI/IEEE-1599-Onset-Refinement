export const stereoToMono = (channelDx, channelSx) => {
  const len = channelDx.length
  let mono = new Array(len)
  for (let i = 0; i < len; i++)
    mono[i] = 0.5 * (channelDx[i] + channelSx[i])
  return mono
}

export const hammingWindow = signal => {
  const n = signal.length
  for (let i = n - 1; i >= 0; i--)
    signal[i] *= 0.54 - 0.46 * Math.cos(6.283185307179586 * i / (n-1))
  return signal
}

// modulo di un numero complesso
export const getModulus = (real, imag) => (real * real + imag * imag) ** 0.5;

// fase di un numero complesso
export const getPhase = (real, imag) => {
  if (real == 0)
    return 0;
  let phase = Math.atan(imag / real);
  if (real < 0)
    phase = (phase + Math.PI) % Math.PI;
  return phase;
}

export const euclideanDistance = (x1, y1, x2, y2) => ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5

export const divideArrayByMax = arr => {
  const max = Math.max(...arr)
  let res = []
  for (let i = 0, len = arr.length; i < len; i++)
    res.push(arr[i] / max)
  return res
}

export const standardize = arr => {
  if (arr === undefined || arr.length === 0) 
  	throw 'standardize error'

  const m = mean(arr)
  const std = standardDeviation(arr, m)
  let res = []
  for (let i = 0; i < arr.length; i++)
    res.push((arr[i] - m) / std)
  return res
}

export const toMs = t => Math.round(t * 1000) / 1000

export const RMSE = (predicted, observed) => {
  const predicted_len = predicted.length
  if (predicted_len != observed.length) throw 'RMSE error: predicted and observed must be of the same size'

  let res = 0
  for (let i = 0; i < predicted_len; i++) {
    res += (predicted[i] - observed[i]) ** 2
  }
  return (res / predicted_len) ** 0.5
}

export const mean = arr => {
  let res = 0
  for (let i = 0; i < arr.length; i++)
    res += arr[i]
  return res / arr.length
}

const standardDeviation = (arr, mean) => {
  let res = 0
  for (let i = 0; i < arr.length; i++)
    res += (arr[i] - mean) ** 2
  return (res / (arr.length - 1)) ** 0.5
}

/*
export const isEqual = (a,b) =>{
	if (a.length!=b.length)
    	return false

    // Comparing each element of array
    for(let i=0;i<a.length;i++)
    	if(a[i]!=b[i])
      		return false
    return true
}
*/