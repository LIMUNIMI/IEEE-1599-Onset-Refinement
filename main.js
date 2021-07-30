const fs = 44100;
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext({sampleRate: fs});

// Nella console del browser appariranno tutte le info sull'esecuzione del codice

// path per la traccia audio da analizzare
const audiofilePath = "audio/mozart.mp3";  
// path per il documento IEEE1599 che verrà modificato           
const filenameXML = "Mozart_Ave_Verum_Corpus.xml";    
// sull'XML è l'attributo file_name della track di cui ci occupiamo
const filenameTrack = "audio/performed by Scuola Corale G. Puccini with Orchestra Filarmonica Emiliana, 04.11.2006.mp3";  

getFile = async (audioContext, filepath) => {
  const response = await fetch(filepath);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  return audioBuffer;
}

loadAudiofile = async () => {
  console.info('... fetching, converting to mono and trimming audiofile');
  const bufferedFile = await getFile(audioCtx, audiofilePath);
  return trimSilence(stereo2mono(bufferedFile.getChannelData(0), bufferedFile.getChannelData(1)));
}

fetchXMLOnsets = doc => {
  const trackEventsByTime = doc.tracks[filenameTrack].trackEventsByTime;
  let originalTimes = Object.keys(trackEventsByTime);
  // casting a numeri di stringhe di tempi
  for (let i = 0, len = originalTimes.length; i < len; i++) 
    originalTimes[i] = +originalTimes[i];
  return originalTimes;
}

editXML = (doc, correctedTimes) => {
  // !!! la sostituzione si basa sul fatto che nell'XML gli start_time siano in ordine crescente
  // correggo gli onset sull'XML
  const tracks = doc.getElementsByTagName("audio")[0].childNodes;
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
            if (track_events[j].getAttributeNode("start_time").nodeValue != curXMLOnset){ 
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

saveXML = s => {
  const ajax = new XMLHttpRequest();
  ajax.onload = function() {
    console.log(this.responseText);
  }
  ajax.open("POST", "createXML.php");
  ajax.setRequestHeader("Content-type", "text/plain");
  ajax.send(s);
}

const t0 = performance.now();

loadAudiofile()
  .then((monoSignal) => {
    let t = performance.now();
    const onsetTimes = onsetDetection(monoSignal);
    console.info("Tempo totale di esecuzione dell'algoritmo: " + (performance.now() - t));
    console.log("Onset trovati dall'algoritmo: ", onsetTimes);

    // confronto gli onset con quelli del documento IEEE1599
    const d = new IEEE1599Document(filenameXML);
    const originalTimes = fetchXMLOnsets(d);
    console.log("Onset di IEEE1599: ", originalTimes);

    const correctedTimes = fixTimes(originalTimes, onsetTimes);
    console.log("Onset di IEEE1599 corretti: ", correctedTimes);

    editXML(d.xmlDoc, correctedTimes);
    // mando al server l'XML con gli onset corretti sotto forma di stringa, per poi salvarlo in locale tramite PHP come "newOnsets.xml"
    saveXML(new XMLSerializer().serializeToString(d.xmlDoc));
    
  })
  .catch((e) => {
    console.error('Error --> ' + e);
  });