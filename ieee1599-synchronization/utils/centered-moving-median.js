export const movingMedian = (arr, winSize) => {

  if (winSize % 2 == 0) throw 'centeredMovingMedian error: winSize must be odd'
  if (winSize > arr.length) throw 'centeredMovingMedian error: winSize is greater than arr length'

  winSize = Math.floor(winSize/2)

  /* 
    Gestisco i bordi a sx e dx in modalità ‘reflect’.
    Se voglio la mediana mobile sul vettore [ a b c d e f g h i j k ] con winSize = 9
    allora la calcolo sul vettore [ d c b a | a b c d e f g h i j k | k j i h ] , che è: 
      - la specchiatura dei primi floor(winSize/2) = 4 elementi
      - il vettore originario
      - la specchiatura degli ultimi floor(winSize/2) = 4 elementi
  */

  const leading = arr.slice(0,winSize).reverse()
  const trailing = arr.slice(-winSize).reverse()
  const c = leading.concat(arr.slice(), trailing)

  /* 
    Posso calcolare la mediana così perchè so che a questa funzione arriverà una finestra di 2*winSize+1 elementi.
    Ordino i valori della finestra e ritorno il winSize-esimo elemento.
  */
  const median = win => win.sort((a, b) => a - b)[winSize]

  let res = []
  for (let i = winSize; i < c.length - winSize; i++)
    res.push( median(c.slice(i-winSize, i+winSize+1)) )

  return res
}

/*
let a = math.random([20000], 0, 1000000)
t0 = performance.now()
a = centeredMedian(a,21)
console.log(performance.now()-t0, a)
*/