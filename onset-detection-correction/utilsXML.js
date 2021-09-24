fetchXMLOnsets = doc => {
  const trackEventsByTime = doc.tracks[filenameTrack].trackEventsByTime;
  let originalTimes = Object.keys(trackEventsByTime);
  // casting a numeri di stringhe di tempi
  for (let i = 0, len = originalTimes.length; i < len; i++)
    originalTimes[i] = +originalTimes[i];
  return originalTimes;
}

editXML = (docXML, correctedTimes) => {
  // !!! la sostituzione si basa sul fatto che nell'XML gli start_time siano in ordine crescente
  // correggo gli onset sull'XML
  const tracks = docXML.getElementsByTagName("audio")[0].childNodes;
  for (let t = 0; t < tracks.length; t++) {
    if (tracks[t].nodeType == 1) {
      if (tracks[t].getAttributeNode("file_name").nodeValue == filenameTrack) {
        let track_events = tracks[t].childNodes[1].childNodes;

        // sovrascrivo i tempi
        let i = 0; // tengo conto di dove sono arrivato in correctedTimes
        let curXMLOnset = track_events[1].getAttributeNode("start_time").nodeValue; // inizializzo allo start_time del primo evento
        for (let j = 0; j < track_events.length; j++) {
          if (track_events[j].nodeType == 1) {
            // quando cambia lo start_time dell'evento cambia anche l'onset da sovrascrivere
            if (track_events[j].getAttributeNode("start_time").nodeValue != curXMLOnset) {
              curXMLOnset = track_events[j].getAttributeNode("start_time").nodeValue;
              i += 1;
            }
            track_events[j].setAttribute("start_time", correctedTimes[i].toString());
          }
        }

      }
    }
  }
  /* per debugging
  for (let t = 0; t < tracks.length; t++) {
    if (tracks[t].nodeType == 1) {
      if (tracks[t].getAttributeNode("file_name").nodeValue == filenameTrack) {
        track_events = tracks[t].childNodes[1].childNodes
        for (let j = 0; j < track_events.length; j++) {
          if (track_events[j].nodeType == 1)
            console.log(track_events[j].getAttributeNode("start_time"))
        }
      }
    }
  }*/
}

saveXML = docXML => {
  // mando il nome dell'XML originale, un separatore ||| e il documento XML con gli onset corretti sotto forma di stringa
  const data = filenameXML + '|||' + new XMLSerializer().serializeToString(docXML);
  const options = {
    method: 'POST',
    body: data,
    headers: {
      'Content-Type': 'text/plain'
    }
  }

  fetch("onset-detection-correction/createXML.php", options)
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.log(err))
}