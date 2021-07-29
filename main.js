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

    // confronto gli onset con quelli del documento IEEE1599
    const d = new IEEE1599Document("Mozart_Ave_Verum_Corpus.xml");
    const trackEventsByTime = d.tracks["audio/performed by Scuola Corale G. Puccini with Orchestra Filarmonica Emiliana, 04.11.2006.mp3"].trackEventsByTime;
    let originalTimes = Object.keys(trackEventsByTime);
    // casting strings of times to numbers
    for (let i = 0, len = originalTimes.length; i < len; i++) 
      originalTimes[i] = +originalTimes[i];
    console.log("Onset di IEEE1599: ", originalTimes);

    let correctedTimes = fixTimes(originalTimes, onsetTimes);
    console.log("Onset di IEEE1599 corretti: ", correctedTimes);

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