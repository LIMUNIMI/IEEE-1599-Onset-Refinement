const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext({sampleRate: 44100});

const getFile = async (audioContext, filepath) => {
  const response = await fetch(filepath);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  return audioBuffer;
}

const loadAudiofile = async () => {
  const filePath = 'audio/cm.mp3';
  const bufferedFile = await getFile(audioCtx, filePath);
  const channel1 = bufferedFile.getChannelData(0);
  const channel2 = bufferedFile.getChannelData(1);
  const monoSignal = channel1.map((currentValue, index) => (currentValue + channel2[index])/2);
  return monoSignal;
}

var t0 = performance.now();
loadAudiofile()
  .then((monoSignal) => {
    console.info('... audio file has been fetched and converted to mono correctly');
    onsetDetection(monoSignal);
    //onsetDetection(monoSignal.slice(0,44100*31));
  })
  .catch((e) => {
    console.error('Error --> ' + e);
  });
