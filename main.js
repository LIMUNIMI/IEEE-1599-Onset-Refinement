const fs = 44100;
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext({sampleRate: fs});

getFile = async (audioContext, filepath) => {
  const response = await fetch(filepath);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  return audioBuffer;
}

loadAudiofile = async () => {
  console.info('... fetching, converting to mono and trimming audiofile');
  const filePath = 'audio/mozart.mp3';
  const bufferedFile = await getFile(audioCtx, filePath);
  return trimSilence(stereo2mono(bufferedFile.getChannelData(0), bufferedFile.getChannelData(1)));
}

const t0 = performance.now();

loadAudiofile()
  .then((monoSignal) => {
    const onsetTimes = onsetDetection(monoSignal);
    console.log("Onset trovati dall'algoritmo: ", onsetTimes);

    const filenameTrack = "audio/performed by Scuola Corale G. Puccini with Orchestra Filarmonica Emiliana, 04.11.2006.mp3"

    // confronto gli onset con quelli del documento IEEE1599
    const d = new IEEE1599Document("Mozart_Ave_Verum_Corpus.xml");
    const trackEventsByTime = d.tracks[filenameTrack].trackEventsByTime;
    let originalTimes = Object.keys(trackEventsByTime);
    // casting strings of times to numbers
    for (let i = 0, len = originalTimes.length; i < len; i++) 
      originalTimes[i] = +originalTimes[i];
    console.log("Onset di IEEE1599: ", originalTimes);

    let correctedTimes = fixTimes(originalTimes, onsetTimes);
    console.log("Onset di IEEE1599 corretti: ", correctedTimes);
    
    // !!! la sostituzione si basa sul fatto che nell'XML gli start_time siano in ordine crescente

    // correggo gli onset sull'XML
    let tracks = d.xmlDoc.getElementsByTagName("audio")[0].childNodes
    for (let t = 0; t < tracks.length; t++) {
      if (tracks[t].nodeType == 1) {
        if (tracks[t].getAttributeNode("file_name").nodeValue == filenameTrack) {
          let track_events = tracks[t].childNodes[1].childNodes

          // sovrascrivo i tempi
          let i = 0 // tengo conto di dove sono arrivato in correctedTimes
          let curXMLOnset = track_events[1].getAttributeNode("start_time").nodeValue // inizializzo allo start_time del primo evento
          //console.log(curXMLOnset)
          for (let j = 0; j < track_events.length; j++) {
            if (track_events[j].nodeType == 1) {
              // quando cambia lo start_time dell'evento cambia anche l'onset da sovrascrivere
              if (track_events[j].getAttributeNode("start_time").nodeValue != curXMLOnset){ 
                curXMLOnset = track_events[j].getAttributeNode("start_time").nodeValue
                i += 1
                //console.log(curXMLOnset)
              } 
              track_events[j].setAttribute("start_time", correctedTimes[i].toString())
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

    // mando al server l'XML con gli onset corretti sotto forma di stringa, per poi salvarlo in locale tramite PHP
    const ajax = new XMLHttpRequest();
    ajax.onload = function() {
      console.log(this.responseText);
    }
    ajax.open("POST", "createXML.php");
    ajax.setRequestHeader("Content-type", "text/plain");
    ajax.send(new XMLSerializer().serializeToString(d.xmlDoc));
    
  })
  .catch((e) => {
    console.error('Error --> ' + e);
  });

  
// cm.mp3 circa 7s (prima circa 30s) 
// long3.mp3 circa 20s
// long5.mp3 circa 32s
// long10.mp3 circa 65s
// long15.mp3 circa 96s
// long20.mp3 circa 142s
// long25.mp3 circa 352s