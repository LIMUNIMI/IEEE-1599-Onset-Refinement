const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext({sampleRate: 44100});

getFile = async (audioContext, filepath) => {
  const response = await fetch(filepath);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  return audioBuffer;
}

loadAudiofile = async () => {
  const filePath = 'audio/cm.mp3';
  const bufferedFile = await getFile(audioCtx, filePath);
  // converting to mono
  const channel1 = bufferedFile.getChannelData(0);
  const channel2 = bufferedFile.getChannelData(1);
  let monoSignal = channel1.map((currentValue, index) => (currentValue + channel2[index])/2);
  // removing trailing silent samples
  let i = 1;
  const len = monoSignal.length;
  while(monoSignal[len-i] == 0)
    i++;
  return monoSignal.slice(0,-i);
}

const t0 = performance.now();

loadAudiofile()
  .then((monoSignal) => {
    console.info('... audio file has been fetched, converted to mono and trimmed correctly');

    const onsetTimes = onsetDetection(monoSignal);
    //onsetTimes = onsetDetection(monoSignal.slice(0,44100*40));
    console.log(onsetTimes);
  })
  .catch((e) => {
    console.error('Error --> ' + e);
  });
