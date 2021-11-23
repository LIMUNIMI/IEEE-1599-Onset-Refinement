// -------------- GLOBAL DATA

const log = document.getElementById("log");
const testBreakpoint = 0;
let showPlots;
let signal_type;
const fs = 44100;
// setting parameters for STFT (parameters used in 'Onset detection revisited', Simon Dixon)
const windowSize = 2048;  // [#samples] (46ms)
const hopSize = 441;      // [#samples] (10ms, 78.5% overlap)
const params = {
  weights : {cm: 0.5, np: 0.5, pp: 0.5, pn: 0.5},    // quanto peso la df complessa [0,1] 
  threshold : {cm: 18, np: 18, pp: 18, pn: 18}       // minimo incremento dB per df percussiva 
};

/*
    cm = complex mixtures
    np = non-pitched percussive (drums ...)
    pp = pitched percussive (piano, guitar ...)
    pn = pitched non-percussive (violin ...)
*/
// --------------

const xml_path = document.getElementById("xml_path");
const track_file_name = document.getElementById("track_file_name");
const load_xml = document.getElementById("load_xml");
load_xml.addEventListener("change", xmlShowHide);
function xmlShowHide(){
  xml_path.disabled = !xml_path.disabled;
  track_file_name.disabled = !track_file_name.disabled;

  if (load_xml.checked){
    document.getElementsByName("xml_path")[0].style.display = "block";
    document.getElementsByName("track_file_name")[0].style.display = "block";
  }
  else{
    document.getElementsByName("xml_path")[0].style.display = "none";
    document.getElementsByName("track_file_name")[0].style.display = "none";
  }
}


document.getElementById("input").addEventListener("reset", xmlReset);
function xmlReset(){
  xml_path.disabled = true;
  track_file_name.disabled = true;
  load_xml.checked = false
  document.getElementsByName("xml_path")[0].style.display = "none";
  document.getElementsByName("track_file_name")[0].style.display = "none";
}


document.getElementById("input").addEventListener("submit", main);
function main(){

  // memorizzo il tipo del segnale nella variabile signal_type
  const signal_types = document.getElementsByName('signal_type');
  for (let i = 0; i < signal_types.length; i++){
      if (signal_types[i].checked)
          signal_type = signal_types[i].value;
  }

  // showPlots : se true mostro i grafici
  showPlots = document.getElementById("show_plots").checked;

  log.innerHTML = "Nella console del browser appariranno tutte le info sull'esecuzione del codice.<br>";
  document.getElementById("spinner").style.display = "block";
  document.getElementById("result").innerHTML = "";
  document.getElementById("df-global").innerHTML = "";
  document.getElementById("df-threshold").innerHTML = "";
  document.getElementById("df-peaks").innerHTML = "";

  // audiofilePath : path per la traccia audio da analizzare
  const audiofilePath =  "audio/" + document.getElementById("track_path").value.replace("C:\\fakepath\\", "");
  
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext({sampleRate: fs});

  getFile = async (audioContext, filepath) => {
    const response = await fetch(filepath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  }

  loadAudiofile = async () => {
    console.info('... fetching, converting to mono and trimming audiofile');
    //log.innerHTML += "... fetching, converting to mono and trimming audiofile<br>";
    const bufferedFile = await getFile(audioCtx, audiofilePath);
    //return trimSilence(stereo2mono(bufferedFile.getChannelData(0), bufferedFile.getChannelData(1)));
    return stereo2mono(bufferedFile.getChannelData(0), bufferedFile.getChannelData(1));
  }

  const t0 = performance.now();

  loadAudiofile()
    .then((monoSignal) => {
      let t = performance.now();
      const onsetTimes = onsetDetection(monoSignal);
      console.info('Tempo totale di esecuzione dell\'algoritmo: ' + (performance.now() - t));
      document.getElementById("spinner").style.display = "none";
      log.innerHTML += "Tempo totale di esecuzione dell'algoritmo: " + (performance.now() - t) + " ms";
      console.log("Onset trovati dall'algoritmo: ", onsetTimes);


      // loadXML : se true lavoro per modificare un XML, altrimenti testo solo l'algoritmo
      const loadXML = document.getElementById("load_xml").checked;
      if (loadXML){

        // filenameXML : path per il documento IEEE1599 che verrà modificato
        const filenameXML = xml_path.value.replace("C:\\fakepath\\", ""); //"Mozart_Ave_Verum_Corpus.xml";
        // filenameTrack : sull'XML è l'attributo file_name della track di cui ci occupiamo
        //const filenameTrack = track_file_name.value; //"audio/performed by Scuola Corale G. Puccini with Orchestra Filarmonica Emiliana, 04.11.2006.mp3";
        
        // confronto gli onset con quelli del documento IEEE1599
        const d = new IEEE1599Document(filenameXML);
        const originalTimes = fetchXMLOnsets(d);
        console.log("Onset di IEEE1599: ", originalTimes);

        const correctedTimes = fixTimes(originalTimes, onsetTimes);
        console.log("Onset di IEEE1599 corretti: ", correctedTimes);

        editXML(d.xmlDoc, correctedTimes);
        // mando al server l'XML con gli onset corretti per poi salvarlo in locale tramite PHP
        saveXML(d.xmlDoc, filenameXML);
      }

    })
    //.catch((e) => console.error('Error --> ' + e));

}

// XML utils

fetchXMLOnsets = doc => {

  const trackEventsByTime = doc.tracks[track_file_name.value].trackEventsByTime;
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
      if (tracks[t].getAttributeNode("file_name").nodeValue == track_file_name.value) {
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

saveXML = (docXML, filenameXML) => {
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
