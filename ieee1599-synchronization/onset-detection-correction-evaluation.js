import { RMSE, mean } from "./utils/math-utils.js"
import { evaluationPlot } from "./plots.js"

export const evaluateTimesCorrection = (groundTruthTimes, tapTimes, correctTapTimes) => {

	const len = groundTruthTimes.length
	let tapDeviations = [], correctTapDeviations = []
	let countEffectiveCorrections = 0

	for (let i = 0; i < len; i++){

	  tapDeviations[i] = tapTimes[i] - groundTruthTimes[i]
	  correctTapDeviations[i] = correctTapTimes[i] - groundTruthTimes[i]

	  if (Math.abs(tapDeviations[i]) >= Math.abs(correctTapDeviations[i]))
	  	countEffectiveCorrections++  
	}

	evaluationPlot(tapDeviations, correctTapDeviations)	// positivo se ritarda, negativo se anticipa
	
	const tapDeviationsRMSE = RMSE(groundTruthTimes, tapTimes).toFixed(3)*1000
	const tapDeviationsAVG = mean(tapDeviations.map(t => Math.abs(t))).toFixed(3)*1000
	const correctTapDeviationsRMSE = RMSE(groundTruthTimes, correctTapTimes).toFixed(3)*1000
	const correctTapDeviationsAVG = mean(correctTapDeviations.map(t => Math.abs(t))).toFixed(3)*1000
	const rateEffectiveCorrections = (countEffectiveCorrections / len * 100).toFixed(2)

	return `<b>Onsets tapping</b><br>
			RMSE: ${tapDeviationsRMSE} ms<br> 
			MAE: ${tapDeviationsAVG} ms<br><br>
			<b>Onsets tapping corrected</b><br>
			RMSE: ${correctTapDeviationsRMSE} ms<br>
			MAE: ${correctTapDeviationsAVG} ms<br><br>
			effective corrections: ${countEffectiveCorrections}/${len} , ${rateEffectiveCorrections}%`
}