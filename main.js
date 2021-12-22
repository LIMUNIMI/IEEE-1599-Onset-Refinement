import { onsetDetection } from "./onset-detection-correction/onset-detection.js"
import { peakPicking, moveSlider } from "./onset-detection-correction/peak-picking.js"
import { fetchXMLOnsets, editXML, saveXML } from "./onset-detection-correction/utilsXML.js"
//import { fixTimesSort } from "./onset-detection-correction/time-correction-sort.js"
import { fixTimes } from "./onset-detection-correction/time-correction.js"

let submitListenerAdded = false

input_form.addEventListener("submit", main);
function main(){

  TRACK_PATH = track_path.value.replace("C:\\fakepath\\", "")

  for (let i = 0; i < signal_types.length; i++)
      if (signal_types[i].checked)
          SIGNAL_TYPE = signal_types[i].value;

  XML_FILE_NAME = xml_path.value.replace("C:\\fakepath\\", "")
  TRACK_FILE_NAME_XML = track_file_name_xml.value;


  log.innerHTML = "Nella console del browser appariranno tutte le info sull'esecuzione del codice.<br>";
  spinner.style.display = "block";
  df_threshold.style.display = "block"
  df_peaks.style.display = "block"
  //result.style.display = "block"
  //result.innerHTML = "";
  slider.value = 0
  slider_value.innerHTML = 0
  slider_p.style.display = "none"
  df_threshold.innerHTML = "";
  df_peaks.innerHTML = "";

  
  const audiofilePath =  "audio/" + TRACK_PATH // path per la traccia audio da analizzare
  
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext({sampleRate: FS});

  const getFile = async (audioContext, filepath) => {
    const response = await fetch(filepath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  }

  const loadAudiofile = async () => {
    console.info('... fetching, converting to mono and trimming audiofile');
    const bufferedFile = await getFile(audioCtx, audiofilePath);
    return stereo2mono(bufferedFile.getChannelData(0), bufferedFile.getChannelData(1));
  }

  loadAudiofile()
    .then((monoSignal) => {
      const t0 = performance.now();
      const df = onsetDetection(monoSignal);
      log.innerHTML += "Tempo totale di esecuzione dell'algoritmo: " + (performance.now() - t0) + " ms<br>";
      spinner.style.display = "none";

      console.info('... computing peak picking and onset times');
      peakPicking(df)

      if (!submitListenerAdded){

        slider_submit.addEventListener("click", submitCorrection)  //quando schiaccio il bottone OK ottengo i tempi con il threshold corrente e faccio la correzione
        submitListenerAdded = true
      }

    })
    //.catch((e) => console.error('Error --> ' + e));
}

const submitCorrection = () => {

  let onsetTimes = moveSlider() 
  console.log("Onset trovati dall'algoritmo: ", onsetTimes)
  slider_p.style.display = "none"
  df_threshold.style.display = "none"
  df_peaks.style.display = "none"

  const doc = new IEEE1599Document(XML_FILE_NAME);
  const originalTimes = fetchXMLOnsets(doc);
  console.log("Onset di IEEE1599: ", originalTimes);

  fixTimes(originalTimes, onsetTimes)   // correzione in-place degli originalTimes
  console.log("Onset di IEEE1599 corretti: ", originalTimes);

  editXML(doc.xmlDoc, originalTimes);
  saveXML(doc.xmlDoc);                  // mando al server l'XML con gli onset corretti per poi salvarlo in locale tramite PHP
}