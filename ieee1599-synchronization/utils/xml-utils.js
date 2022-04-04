let allRestEventsTimes

export const fetchTrackFileNameAttributesFromXML = docXML => {
  
  let trackFileNameAttributes = []
  const tracks = docXML.getElementsByTagName("audio")[0].childNodes;
  for (let t = 0; t < tracks.length; t++){
    if (tracks[t].nodeType == 1)
      trackFileNameAttributes.push(tracks[t].getAttributeNode("file_name").nodeValue)
  }
  return trackFileNameAttributes
}

export const fetchOnsetTimesFromXML = (doc, trackFileNameAttributeOnXml, memorizeRestEventsTimes = false) => {

  // non vengono fetchati i tempi di eventi di sole pause
  const onsetEventsByTime = doc.tracks[trackFileNameAttributeOnXml].trackEventsByTime
  const restEvents = Object.keys(doc.rests)

  let _allRestEventsTimes = []
  Object.entries(onsetEventsByTime).forEach(([time, events]) => {
    if (events.every(e => restEvents.includes(e) || e.startsWith("clef") || e.startsWith("keysig")))
      _allRestEventsTimes.push(time)
  });

  if (memorizeRestEventsTimes) 
    allRestEventsTimes = _allRestEventsTimes

  return Object.keys(onsetEventsByTime)
          .filter(t => !_allRestEventsTimes.includes(t))
          .map(t => (t === "-0.001") ? 0 : +t)
}

export const editAndSaveXML = (docXML, trackFileNameAttributeOnXml, xmlFileName, correctedTimes) => {

  // editXML
  if (allRestEventsTimes === undefined) throw 'editXML error: allRestEventsTimes is undefined'

  const tracks = docXML.getElementsByTagName("audio")[0].childNodes;
  let t = 0
  while (t < tracks.length){
    if (tracks[t].nodeType == 1 && tracks[t].getAttributeNode("file_name").nodeValue == trackFileNameAttributeOnXml) 
      break
    t++
  }

  const trackNodes = tracks[t].childNodes
  let trackEvents
  for (let i = 0; i < trackNodes.length; i++)
    if (trackNodes[i].nodeName == "track_indexing")
      trackEvents = trackNodes[i].childNodes

  let i = 0           // tengo conto di dove sono arrivato in correctedTimes
  let iUsed = false   // ho assegnato il correctedTimes[i] a qualche evento nell'XML

  let refOnsetTime = trackEvents[1].getAttributeNode("start_time").nodeValue // tempo del primo evento sull'XML
  if (refOnsetTime === "0") refOnsetTime = "-0.001"

  for (let j = 0; j < trackEvents.length; j++) {
    if (trackEvents[j].nodeType == 1) {
      

      let t = trackEvents[j].getAttributeNode("start_time").nodeValue // tempo dell'evento corrente
      if (t === "0") t = "-0.001"

      if (t === refOnsetTime){
        if (allRestEventsTimes.includes(t)) continue
      }
      else{ 
        refOnsetTime = t
        if (allRestEventsTimes.includes(t)) continue
        if (iUsed){
          i++
          iUsed = false
        }
      }

      trackEvents[j].setAttribute("start_time", correctedTimes[i].toString());
      if (!iUsed) iUsed = true
    }
  }

  // devo aver assegnato tutti i correctedTimes, nè più nè meno
  // se la corrrezione dei tempi è stata fatta in modo corretto sicuramente questa eccezione non verrà lanciata
  if (i !== correctedTimes.length-1) throw 'editAndSaveXML error: wrong XML editing' 

  // saveXML
  // mando il nome dell'XML originale, un separatore ||| e il documento XML con gli onset corretti sotto forma di stringa
  const data = xmlFileName + '|||' + new XMLSerializer().serializeToString(docXML); 
  const options = {
      method: 'POST',
      body: data,
      headers: {
          'Content-Type': 'text/plain'
      }
  }

  fetch("ieee1599-synchronization/createXML.php", options)
      .then(res => res.json())
      .then(data => document.getElementById("log").innerHTML += `<br>${data}`)
      .catch(err => console.log(err))
}