fixTimes = (original, found) => {

	// original : tempi degli onset sul documento IEEE1599
	// found : tempi degli onset trovati dall'algoritmo

	// questa funzione modifica un tempo original se c'è un tempo found 
	// che cade in un intorno arbitrariamente largo di original

	// ritorna array dei nuovi tempi corretti

	let correctedTimes = original.slice()

	let u = original.concat(found);
	for (let i=0, len=u.length, len_original=original.length; i<len; i++)
		(i < len_original) ? u[i] = [u[i], true] : u[i] = [u[i], false]
	u = u.sort((a, b) => a[0] - b[0]);

	const limit = 0.2; 		// intorno in s entro cui correggo tempo di IEEE1599 col tempo del mio onset
	const len = u.length;
	let j = 0; 				// indice per tenere conto dove sono nell'array original

	// caso speciale primo elemento
	if (u[0][1] == true){
		if (u[1][1] == false && u[1][0]-u[0][0] <= limit) 
			correctedTimes[j] = u[1][0];
		j += 1;	
	}
	// caso generale
	let i = 1, cond1 = null, cond2 = null;
	while (i < len-1){
		if (u[i][1] == true){

			cond1 = (u[i-1][1] == false && u[i][0]-u[i-1][0] <= limit)
			cond2 = (u[i+1][1] == false && u[i+1][0]-u[i][0] <= limit)

			if (cond1 && cond2){
				(u[i][0]-u[i-1][0] > u[i+1][0]-u[i][0]) ? correctedTimes[j] = u[i+1][0] : correctedTimes[j] = u[i-1][0]
				j += 1;
				i += 1;
				continue;
			}

			if (cond1) correctedTimes[j] = u[i-1][0];
			if (cond2) correctedTimes[j] = u[i+1][0];
			j += 1;
		}
		i += 1;
	}
	// caso speciale ultimo elemento
	if (u[len-1][1] == true){
		if (u[len-2][1] == false && u[len-1][0]-u[len-2][0] <= limit) 
			correctedTimes[j] = u[len-2][0];
		j += 1;	
	}

	if (correctedTimes.length !== Array.from(new Set(correctedTimes)).length) {
		// se entro qui la nuova mappatura contiene duplicati 
		// (cioè eventi che avvengono in tempi diversi sono stati erroneamente mappati sullo stesso tempo)
		for (let i=0, len=correctedTimes.length; i<len-1; i++){
			if (correctedTimes[i] == correctedTimes[i+1]){
				// correctedTimes[i] è un duplicato
				// conto quanti elementi duplicati uguali ci sono in fila
				let cont = 0;
				while (i+cont+1 < len && correctedTimes[i+cont] == correctedTimes[i+cont+1])
					cont += 1;
				// sostituisco gli elementi mappati sullo stesso tempo con i tempi originari di IEEE1599
				for (let j=0; j<=cont; j++) 
					correctedTimes[i+j] = original[i+j];
			}
		}
	}
	return correctedTimes;
}