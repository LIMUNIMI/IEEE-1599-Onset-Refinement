import { onsetDetection }                                                               from "./ieee1599-synchronization/onset-detection-correction.js"
import { evaluateTimesCorrection }                                                      from "./ieee1599-synchronization/onset-detection-correction-evaluation.js"
import { mainPlot }                                                                     from "./ieee1599-synchronization/plots.js"
import { stereoToMono }                                                                 from "./ieee1599-synchronization/utils/math-utils.js"
import { fetchTrackFileNameAttributesFromXML, fetchOnsetTimesFromXML, editAndSaveXML }  from "./ieee1599-synchronization/utils/xml-utils.js"

export const FS = 44100
export const WINDOW_SIZE = 2048                   // [#samples] (46ms)
export const WINDOW_SIZE_HALF = WINDOW_SIZE / 2    
export const HOP_SIZE = 441                       // [#samples] (10ms, 78.5% overlap)
export let LIMIT

const log                                 = document.getElementById("log")
const result                              = document.getElementById("result")
const df_threshold                        = document.getElementById("df_threshold")
const df_peaks                            = document.getElementById("df_peaks")
const evaluation                          = document.getElementById("evaluation")
const evaluation_stats                    = document.getElementById("evaluation_stats")
const refine_correction                   = document.getElementById("refine_correction")
const spinner                             = document.getElementById("spinner")
const mode                                = document.querySelectorAll('input[type=radio][name="mode"]')
const use_mode_input                      = document.getElementById('use_mode_input')
const use_mode_submit                     = document.getElementById('use_mode_submit')
const test_mode_input                     = document.getElementById('test_mode_input')
const track_file_name                     = document.getElementById("track_file_name")
const track_type                          = document.querySelectorAll('input[type=radio][name="track_type"]')
const xml_file_name                       = document.getElementById('xml_file_name')
const xml_file_name_error                 = document.getElementById('xml_file_name_error')
const p_track_file_name_attribute_on_xml  = document.getElementById('p_track_file_name_attribute_on_xml')
const track_file_name_attribute_on_xml    = document.getElementById('track_file_name_attribute_on_xml')

const inputs = {
  
  "piano1" :      ["mp3-from-musescore/piano1.mp3",      "xml-from-musescore/piano1_midi_tap.xml",      "piano1.mp3",       false],
  "piano2" :      ["mp3-from-musescore/piano2.mp3",      "xml-from-musescore/piano2_midi_tap.xml",      "piano2.mp3",       false],
  "violin1" :     ["mp3-from-musescore/violin1.mp3",     "xml-from-musescore/violin1_midi_tap.xml",     "violin1.mp3",      true],
  "violin2" :     ["mp3-from-musescore/violin2.mp3",     "xml-from-musescore/violin2_midi_tap.xml",     "violin2.mp3",      true],
  "sax" :         ["mp3-from-musescore/sax.mp3",         "xml-from-musescore/sax_midi_tap.xml",         "sax.mp3",          false],
  "string_4et" :  ["mp3-from-musescore/string_4et.mp3",  "xml-from-musescore/string_4et_midi_tap.xml",  "string_4et.mp3",   true],
  "trumpet_4et" : ["mp3-from-musescore/trumpet_4et.mp3", "xml-from-musescore/trumpet_4et_midi_tap.xml", "trumpet_4et.mp3",  true],
  "jazz_4et" :    ["mp3-from-musescore/jazz_4et.mp3",    "xml-from-musescore/jazz_4et_midi_tap.xml",    "jazz_4et.mp3",     false],

  "leveau_cello1" : [     "leveau/cello1.wav",     "leveau/leveau_cello1.xml",     "cello1.wav",      true],
  "leveau_clarinet1" : [  "leveau/clarinet1.wav",  "leveau/leveau_clarinet1.xml",  "clarinet1.wav",   true],
  "leveau_classic2" : [   "leveau/classic2.wav",   "leveau/leveau_classic2.xml",   "classic2.wav",    true],
  "leveau_classic3" : [   "leveau/classic3.wav",   "leveau/leveau_classic3.xml",   "classic3.wav",    true],
  "leveau_distguit1" : [  "leveau/distguit1.wav",  "leveau/leveau_distguit1.xml",  "distguit1.wav",   true],
  "leveau_guitar2" : [    "leveau/guitar2.wav",    "leveau/leveau_guitar2.xml",    "guitar2.wav",     true],
  "leveau_guitar3" : [    "leveau/guitar3.wav",    "leveau/leveau_guitar3.xml",    "guitar3.wav",     true],
  "leveau_jazz2" : [      "leveau/jazz2.wav",      "leveau/leveau_jazz2.xml",      "jazz2.wav",       true],
  "leveau_jazz3" : [      "leveau/jazz3.wav",      "leveau/leveau_jazz3.xml",      "jazz3.wav",       true],
  "leveau_piano1" : [     "leveau/piano1.wav",     "leveau/leveau_piano1.xml",     "piano1.wav",      true],
  "leveau_pop1" : [       "leveau/pop1.wav",       "leveau/leveau_pop1.xml",       "pop1.wav",        true],
  "leveau_rock1" : [      "leveau/rock1.wav",      "leveau/leveau_rock1.xml",      "rock1.wav",       true],
  "leveau_sax1" : [       "leveau/sax1.wav",       "leveau/leveau_sax1.xml",       "sax1.wav",        true],
  "leveau_synthbass1" : [ "leveau/synthbass1.wav", "leveau/leveau_synthbass1.xml", "synthbass1.wav",  true],
  "leveau_techno2" : [    "leveau/techno2.wav",    "leveau/leveau_techno2.xml",    "techno2.wav",     true],
  "leveau_trumpet1" : [   "leveau/trumpet1.wav",   "leveau/leveau_trumpet1.xml",   "trumpet1.wav",    true],
  "leveau_violin2" : [    "leveau/violin2.wav",    "leveau/leveau_violin2.xml",    "violin2.wav",     true]
}

let inUseMode = true 
let xmlFileName, xmlPath, trackFileName, trackFileNameAttributeOnXml

mode.forEach(m => m.addEventListener('change', () => {
  inUseMode = mode[0].checked
  if (inUseMode){
    use_mode_input.style.display = 'block'
    test_mode_input.style.display = 'none'
    use_mode_input.reset()
  }
  else{
    use_mode_input.style.display = 'none'
    test_mode_input.style.display = 'block'
    test_mode_input.reset()
  }
}));

window.addEventListener('load', event => {
    mode[0].checked = true
    use_mode_input.style.display = 'block'
    test_mode_input.style.display = 'none'
    use_mode_input.reset()
});

xml_file_name.addEventListener('change', () => {

  // pulisco le options vecchie
  while (track_file_name_attribute_on_xml.length > 0)
    track_file_name_attribute_on_xml.remove(track_file_name_attribute_on_xml.length-1)

  p_track_file_name_attribute_on_xml.style.display = 'none'
  xml_file_name_error.innerHTML = ''
  use_mode_submit.disabled = false
  xmlFileName = xml_file_name.files[0].name
  xmlPath = "xml-docs/" + xmlFileName

  try{
    const trackFileNameAttributes = fetchTrackFileNameAttributesFromXML(new IEEE1599Document(xmlPath).xmlDoc)
    for (let i = 0; i < trackFileNameAttributes.length; i++){
      const opt = document.createElement('option');
      opt.value = trackFileNameAttributes[i]
      opt.innerHTML = trackFileNameAttributes[i]
      track_file_name_attribute_on_xml.appendChild(opt)
      p_track_file_name_attribute_on_xml.style.display = 'block'
    }
  }
  catch{
    xml_file_name_error.innerHTML = 'Ci sono stati problemi nel recuperare i dati delle tracce sul documento XML IEEE 1599'
    use_mode_submit.disabled = true
  }
});

const submit = () => {

  let groundTruthTimes, softOnsets

  if (inUseMode){ 
    // use mode
    trackFileName = track_file_name.files[0].name
    trackFileNameAttributeOnXml = track_file_name_attribute_on_xml.options[track_file_name_attribute_on_xml.selectedIndex].value
    softOnsets = (track_type[0].checked) ? false : true
  }
  else{ 
    // test mode
    let selectedTrack
    const input = document.getElementsByName('input')
    for (let i = 0; i < input.length; i++){
        if (input[i].checked)
            selectedTrack = input[i].value
    }

    xmlFileName = inputs[selectedTrack][1]
    xmlPath = "xml-docs/" + xmlFileName
    trackFileName = inputs[selectedTrack][0]
    trackFileNameAttributeOnXml = inputs[selectedTrack][2]
    softOnsets = inputs[selectedTrack][3]

    const xmlGroundTruthPath = "xml-docs/" + xmlFileName.replace("tap", "ground_truth")

    groundTruthTimes = fetchOnsetTimesFromXML( new IEEE1599Document(xmlGroundTruthPath), trackFileNameAttributeOnXml );
    if (!xmlGroundTruthPath.startsWith("xml-docs/leveau/leveau_"))
      groundTruthTimes = groundTruthTimes.map( t => t + 0.057 );
  }

  const tapTimes = fetchOnsetTimesFromXML( new IEEE1599Document(xmlPath), trackFileNameAttributeOnXml, true)
  LIMIT = (softOnsets) ? 0.05 : 0.1

  log.innerHTML = "Nella console del browser appariranno tutte le info sull'esecuzione del codice.<br>"
  spinner.style.display = "block"
  result.innerHTML = df_threshold.innerHTML = df_peaks.innerHTML = evaluation.innerHTML = evaluation_stats.innerHTML = ""//refine_correction.innerHTML = ""

  // audio file loading via Web Audio API
  const loadAudiofile = url => {

    console.info('... fetching and converting to mono the audiofile');

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext({sampleRate: FS});

    fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        let monoSignal
        if (audioBuffer.numberOfChannels == 1) 
          monoSignal = audioBuffer.getChannelData(0)
        else if (audioBuffer.numberOfChannels == 2) 
          monoSignal = stereoToMono(audioBuffer.getChannelData(0), audioBuffer.getChannelData(1))
        else 
          throw 'loadAudiofile error: audio file should be either mono or stereo'
        main(monoSignal)
      });
  }

  const main = monoSignal => {

    const startTime = performance.now()
    const res = onsetDetection(monoSignal, tapTimes.slice())
    const totalTime = performance.now() - startTime

    log.innerHTML += `Tempo totale di esecuzione dell'algoritmo: ${totalTime} ms`
 
    spinner.style.display = "none"

    // non considero le correzioni dei legati
    if (xmlFileName == "xml-from-musescore/violin2_midi_tap.xml"){
      res['correctTapTimes'][4] = tapTimes[4]
      res['correctTapTimes'][10] = tapTimes[10]
      res['correctTapTimes'][17] = tapTimes[17]
      res['correctTapTimes'][32] = tapTimes[32]
      res['correctTapTimes'][37] = tapTimes[37]
    }
    if (xmlFileName == "xml-from-musescore/sax_midi_tap.xml"){
      res['correctTapTimes'][7] = tapTimes[7]
      res['correctTapTimes'][16] = tapTimes[16]
      res['correctTapTimes'][28] = tapTimes[28]
      res['correctTapTimes'][38] = tapTimes[38]
    }

    /* log utili per il debug
    console.log('Tutti gli onset trovati dall\'algoritmo:', res['allOnsetsFound'])
    console.log('Onset del tapping nel documento IEEE 1599:', tapTimes)
    console.log('Onset del tapping nel documento IEEE 1599 corretti:', res['correctTapTimes'])
    */

    mainPlot( monoSignal, res['odfCD'], res['odfCDdiff'], groundTruthTimes, tapTimes, res['correctTapTimes'], res['allOnsetsFound'] )

    if (inUseMode)
      editAndSaveXML(new IEEE1599Document(xmlPath).xmlDoc, trackFileNameAttributeOnXml, xmlFileName, res['correctTapTimes'])
    else
      evaluation_stats.innerHTML = evaluateTimesCorrection(groundTruthTimes, tapTimes, res['correctTapTimes'])

  }

  const url = "audio/" + trackFileName
  loadAudiofile(url)
};

test_mode_input.addEventListener("submit", submit)
use_mode_input.addEventListener("submit", submit)
use_mode_input.addEventListener("reset", () => {
  p_track_file_name_attribute_on_xml.style.display = 'none'
  xml_file_name_error.innerHTML = ''
  use_mode_submit.disabled = false
})