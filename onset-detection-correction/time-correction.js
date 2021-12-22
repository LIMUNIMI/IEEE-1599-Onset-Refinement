export const fixTimes = (original, found) => { 

	/*************** 

		original : array dei tempi degli onset sul documento IEEE-1599
		found : array dei tempi degli onset trovati dall'algoritmo

		Questa funzione modifica in-place un tempo in original se c'è un tempo in found che cade in un intorno largo LIMIT di original.
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

	// aggiungo due onset found d'appoggio, essi non verranno mai sostituiti a degli onset original ma semplificano la scrittura dell'algoritmo

	found.unshift(original[0] - LIMIT - 0.1) 				// serve ad evitare il caso in cui non ci sia nessuno onset found prima del primo onset original
	found.push(original[original.length-1] + LIMIT + 0.1) 	// serve ad evitare il caso in cui non ci sia nessun onset found dopo l'ultimo onset original

	for (let i = 0, cur = 0; i < found.length && cur < original.length; i++){

		if (found[i] <= original[cur] && found[i+1] > original[cur]){

			differenceWithPrev = original[cur] - found[i]
			differenceWithNext = found[i+1] - original[cur]

			limitPrev = limitNext
			limitNext = ( cur+1 < original.length && original[cur+1] - original[cur] < LIMIT*2 ) ? (original[cur+1] - original[cur]) * 0.4 : LIMIT

			replaceWithPrev = (differenceWithPrev <= limitPrev)
			replaceWithNext = (differenceWithNext <= limitNext)

			//console.log(original[cur], found[i], limitPrev, differenceWithPrev, replaceWithPrev, found[i+1], limitNext, differenceWithNext, replaceWithNext)

			// sostituzione onset originale
			if (replaceWithPrev && replaceWithNext){
				original[cur] = (differenceWithPrev > differenceWithNext) ?  found[i+1] : found[i]
				cur += 1
				continue
			}
			if (replaceWithPrev) original[cur] = found[i]
			if (replaceWithNext) original[cur] = found[i+1]
			cur += 1
		}	
		else if (found[i] > original[cur]) i -= 2;	
		/* 
			con l'elseif risolvo il caso in cui il found successivo sia dopo l'original successivo, capita ad esempio in

			let original = [  1,          2,            3,                 3.1,            4]
			let found = [0.9,   1.12, 1.9,                 3.04,    3.15,          3.8,             4.2]

			quando dal found 1.9 passo direttamente al found 3.04, che è > dell'original 3
			i -= 2 mi fa tornare indietro di onset nel found mentre ho avanzato col cur
			quindi sia per 2 che per 3 considero come prev 1.9 e come next 3.04
		*/	
	}
}