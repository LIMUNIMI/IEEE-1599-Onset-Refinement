export const fixTimesSort = (original, found) => { 

	/*************** 

		original : array dei tempi degli onset sul documento IEEE-1599
		found : array dei tempi degli onset trovati dall'algoritmo

		Questa funzione modifica un tempo in original se c'è un tempo in found che cade in un intorno largo LIMIT di original.
		Il caso in cui gli intorni di onset original adiacenti si sovrappongono è opportunamente gestito.

	***************/

	if (original == undefined) throw "original is undefined"
	if (found == undefined) throw "found is undefined"
	if (original.length == 0) throw "original is empty"
	if (found.length == 0) return
	
	//const limit = 0.2 								// larghezza di default dell'intorno 
	let limitPrev = LIMIT, limitNext = LIMIT 		// larghezza effettiva dell'intorno verso indietro e verso avanti
	let differenceWithPrev, differenceWithNext		// differenza dell'onset original con l'onset found precedente / successivo
	let replaceWithPrev, replaceWithNext 			// true se posso sostituire l'onset original con l'onset found precedente / successivo

	let allOnsets = found.concat(original)

	for (let i = 0; i < allOnsets.length; i++)
		allOnsets[i] = (i < found.length) ? { t: allOnsets[i], isOriginal: false } : { t: allOnsets[i], isOriginal: true }

	// aggiungo due onset found d'appoggio, essi non verranno mai sostituiti a degli onset original ma semplificano la scrittura dell'algoritmo

	allOnsets.push({ t: original[0] - LIMIT - 0.1, isOriginal: false })						// serve ad evitare il caso in cui non ci sia nessuno onset found prima del primo onset original
	allOnsets.push({ t: original[original.length-1] + LIMIT + 0.1, isOriginal: false })		// serve ad evitare il caso in cui non ci sia nessun onset found dopo l'ultimo onset original

	allOnsets.sort((a, b) => a.t - b.t)

	for (let i = 0, cur = 0; i < allOnsets.length-1 && cur < original.length; i++){

		if (allOnsets[i].isOriginal){

			limitPrev = limitNext
			limitNext = ( cur+1 < original.length && original[cur+1] - original[cur] <= LIMIT*2 ) ? (original[cur+1] - original[cur]) * 0.4 : LIMIT

			replaceWithPrev = false
			if (! allOnsets[i-1].isOriginal ){

				differenceWithPrev = allOnsets[i].t - allOnsets[i-1].t
				replaceWithPrev = (differenceWithPrev <= limitPrev)
			}

			replaceWithNext = false
			if (! allOnsets[i+1].isOriginal){

				differenceWithNext = allOnsets[i+1].t - allOnsets[i].t
				replaceWithNext = (differenceWithNext <= limitNext)
			}

			//console.log(original[cur], limitPrev, differenceWithPrev, replaceWithPrev, limitNext, differenceWithNext, replaceWithNext)

			// sostituzione onset originale
			if (replaceWithPrev && replaceWithNext){
				allOnsets[i].t = (differenceWithPrev > differenceWithNext) ?  allOnsets[i+1].t : allOnsets[i-1].t
				cur += 1
				continue
			}
			if (replaceWithPrev) allOnsets[i].t = allOnsets[i-1].t
			if (replaceWithNext) allOnsets[i].t = allOnsets[i+1].t
			cur += 1;	
		}

	}
	
	allOnsets = allOnsets.filter(x => x.isOriginal).map(x => x.t)
	for (let i = 0; i < original.length; i++)
		original[i] = allOnsets[i]
}