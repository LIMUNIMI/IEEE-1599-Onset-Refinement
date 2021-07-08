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
  const filePath = 'audio/cm.mp3';
  const bufferedFile = await getFile(audioCtx, filePath);
  return trimSilence(stereo2mono(bufferedFile.getChannelData(0), bufferedFile.getChannelData(1)));
}

const t0 = performance.now();

loadAudiofile()
  .then((monoSignal) => {
    const onsetTimes = onsetDetection(monoSignal);
    console.log(onsetTimes);
  })
  .catch((e) => {
    console.error('Error --> ' + e);
  });

  // cm.mp3 con utilities circa 30s
  // cm.mp3 prima circa 7s