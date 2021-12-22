const FS = 44100
// setting parameters for STFT (parameters used in 'Onset detection revisited', Simon Dixon)
const WINDOW_SIZE = 2048   // [#samples] (46ms)
const HOP_SIZE = 441       // [#samples] (10ms, 78.5% overlap)
const PARAMS = {
    weights : {   cm: 0.7,  np: 0.5,  pp: 0.7,  pn: 0.7 },   // quanto peso la df complessa [0,1] 
    threshold : { cm: 22,   np: 18,   pp: 21,   pn: 21 }     // minimo incremento dB per df percussiva 
}
const LIMIT = 0.20

let TRACK_PATH
let SIGNAL_TYPE
let XML_FILE_NAME
let TRACK_FILE_NAME_XML

const input_form = document.getElementById("input_form")
const track_path = document.getElementById("track_path")
const signal_types = document.getElementsByName('signal_type')
const xml_path = document.getElementById("xml_path")
const track_file_name_xml = document.getElementById("track_file_name_xml")

const log = document.getElementById("log");

//const result = document.getElementById("result")
const df_threshold = document.getElementById("df_threshold")
const df_peaks = document.getElementById("df_peaks")

const spinner = document.getElementById("spinner")

const slider_p = document.getElementById("slider_p")
const slider = document.getElementById("slider")
const slider_value = document.getElementById("slider_value")
const slider_submit = document.getElementById("slider_submit")