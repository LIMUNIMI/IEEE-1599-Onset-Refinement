import { FS, WINDOW_SIZE, WINDOW_SIZE_HALF, HOP_SIZE, LIMIT } 						 from "../main.js"
import { STFT } 																													 from "./utils/stft.js"
import { divideArrayByMax, standardize, toMs }	                           from "./utils/math-utils.js"
import { movingMedian } 																					         from "./utils/centered-moving-median.js"
import { thresholdPlot, peaksPlot } 																			 from "./plots.js"

let res = {}

export const onsetDetection = (monoSignal, tapTimes) => {

  console.info('... computing STFT')
  const frames = STFT(monoSignal)

  console.info('... computing ODF')
  const odf = getComplexDomainODF(frames)

  console.info('... computing peak picking and onset times')
  const peaks = peakPicking(odf)

  const monoSignalLengthInSeconds = monoSignal.length / FS
  let n = 0, mean = 1
  let correctTapTimes = []

  while (Math.abs(mean) >= 0.001 && n < 10) {

    console.info('... computing tapping times correction ' + (n+1))
    correctTapTimes = timesCorrection(tapTimes.slice(), peaks)

    // calcolo la deviazione media dei tempi corretti da quelli del tapping
    mean = 0
    for (let i = 0; i < tapTimes.length; i++)
      mean += correctTapTimes[i] - tapTimes[i]
    mean /= tapTimes.length

    // traslo un tempo del tapping solo se non esce dai confini del segnale 
    for (let i = 0; i < tapTimes.length; i++) {
      let newTime = tapTimes[i] + mean
      if (newTime >= 0 && newTime <= monoSignalLengthInSeconds)
        tapTimes[i] = newTime
    }

    n++
  }

  res['correctTapTimes'] = correctTapTimes.slice()
  return res
}

const getComplexDomainODF = frames => {

    // atan2(sin(phi), cos(phi)) mappa una fase phi in [-pi, pi]
  const mapPhase = phi => {
    return Math.atan2(Math.sin(phi), Math.cos(phi))
  }

  const euclideanDistance = (x1, y1, x2, y2) => {
    return ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5
  }

  let targetAmplitudes = []
  let targetPhases = []

  // setto modulo e fase target per il 1st e il 2nd frame
  targetAmplitudes.push(new Array(WINDOW_SIZE).fill(0))
  targetAmplitudes.push(frames[0][0])
  targetPhases.push(new Array(WINDOW_SIZE).fill(0))
  targetPhases.push(new Array(WINDOW_SIZE).fill(0))

  // setto modulo e fase target per tutti gli altri frame
  for (let i = 2; i < frames.length; i++) {

    targetAmplitudes.push(frames[i-1][0])

    let targetPhasesFrame = []
    for (let k = 0; k < WINDOW_SIZE; k++)
      targetPhasesFrame.push(
        mapPhase(2*frames[i-1][1][k] - frames[i-2][1][k]))
    targetPhases.push(targetPhasesFrame)
  }

  // costruisco la Complex Domain ODF
  let odfCD = []
  for (let i = 0; i < frames.length; i++) {

    let stationarityMeasure = 0
    for (let k = 0; k < WINDOW_SIZE; k++) {

      // misuro la distanza euclidea per il k-esimo bin fra 
      // target e misura della STFT nello spazio complesso
      stationarityMeasure += euclideanDistance(
        
        targetAmplitudes[i][k] * Math.cos(targetPhases[i][k]),  // Re target 
        frames[i][0][k] * Math.cos(frames[i][1][k]),            // Re misurato 
        targetAmplitudes[i][k] * Math.sin(targetPhases[i][k]),  // Im target    
        frames[i][0][k] * Math.sin(frames[i][1][k])             // Im misurato       
      )
    }
    odfCD.push(stationarityMeasure)
  }

  res['odfCD'] = divideArrayByMax(odfCD)

  // calcolo il differenziale della Complex Domain ODF
  for (let i = odfCD.length-1; i > 0; i--)
    odfCD[i] -= odfCD[i-1]
  odfCD[0] = 0

  res['odfCDdiff'] = divideArrayByMax(odfCD)

  return odfCD
}

const peakPicking = odf => {

  // standardizzo la ODF (mean 0 e std 1)
  odf = standardize(odf)

  // calcolo la soglia tramite una mediana mobile
  const movingMedianWindowSize = 21
  const threshold = movingMedian(odf, movingMedianWindowSize)

  thresholdPlot(odf, threshold)

  // sottraggo la soglia alla ODF
  for (let i = 0; i < odf.length; i++)
    odf[i] -= threshold[i]

  // scelgo come picchi i massimi locali positivi della ODF in finestre di dimensione 7
  let peaks = []
  for (let i = 3; i < odf.length-3; i++) {
    if (odf[i] >= 0 &&
        odf[i-1] <= odf[i] && odf[i] >= odf[i+1] &&
        odf[i-2] <= odf[i] && odf[i] >= odf[i+2] &&
        odf[i-3] <  odf[i] && odf[i] >  odf[i+3]) {
      peaks.push([i, odf[i]])
    }
  }

  peaksPlot(odf, peaks)

  // prendo come tempo rappresentativo del frame il tempo in mezzo al frame
  const frameTime = WINDOW_SIZE_HALF / FS 
  const offsetTime = HOP_SIZE / FS

  peaks = peaks.map(p => [frameTime + offsetTime * p[0], p[1]])

  res['allOnsetsFound'] = peaks.map(p => p[0])

  return peaks
}

const timesCorrection = (tapTimes, peaks) => {

  let correctTapTimes = []
  let curPeak = 0
  for (let i = 0; i < tapTimes.length; i++) {

    let maxODF = Number.NEGATIVE_INFINITY
    let maxTime = -1
    for (let j = curPeak; j < peaks.length; j++) {

      const diff = tapTimes[i] - peaks[j][0]
      const diffAbs = Math.abs(diff)
      if (diff >= LIMIT || 
        (i != 0 && 
          diffAbs >= Math.abs(tapTimes[i-1] - peaks[j][0])))
      {  
        // il picco è più indietro dell'inizio dell'intorno del tap corrente OPPURE 
        // il picco è più vicino al tap precedente che a quello corrente
        curPeak += 1
      }
      else if (diffAbs < LIMIT && 
        (i == tapTimes.length-1 ||
          diffAbs < Math.abs(tapTimes[i+1] - peaks[j][0])))
      {    
        // il picco è nell'intorno del tap corrente E
        // il picco non è più vicino al tap successivo che a quello corrente
        if (peaks[j][1] > maxODF)
          [maxTime, maxODF] = peaks[j]
      } 
      else  
        break   // passo a correggere il tap successivo
    }
    correctTapTimes.push(toMs((maxTime == -1) ? tapTimes[i] : maxTime) )
  }

  return correctTapTimes
}