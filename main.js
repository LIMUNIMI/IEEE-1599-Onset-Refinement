const fs = 44100;
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext({ sampleRate: fs });

// Nella console del browser appariranno tutte le info sull'esecuzione del codice

// audiofilePath : path per la traccia audio da analizzare
const audiofilePath = "audio/mozart.mp3";

// filenameXML : path per il documento IEEE1599 che verrà modificato           
const filenameXML = "Mozart_Ave_Verum_Corpus.xml";

// filenameTrack : sull'XML è l'attributo file_name della track di cui ci occupiamo
const filenameTrack = "audio/performed by Scuola Corale G. Puccini with Orchestra Filarmonica Emiliana, 04.11.2006.mp3";

getFile = async (audioContext, filepath) => {
  const response = await fetch(filepath);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = audioContext.decodeAudioData(arrayBuffer);
  return audioBuffer;
}

loadAudiofile = async () => {
  console.info('... fetching, converting to mono and trimming audiofile');
  const bufferedFile = await getFile(audioCtx, audiofilePath);
  return trimSilence(stereo2mono(bufferedFile.getChannelData(0), bufferedFile.getChannelData(1)));
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
    // mando al server l'XML con gli onset corretti per poi salvarlo in locale tramite PHP
    saveXML(d.xmlDoc);

  })
  .catch((e) => {
    console.error('Error --> ' + e);
  });