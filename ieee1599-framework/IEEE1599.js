function Author(xml)
{
  if (xml == undefined)
    return null;
  //if (xml.hasAttribute("type"))
    this.type = xml.getAttribute("type");
  if (xml.textContent != undefined)
    this.name = xml.textContent;
  else if (xml.text != undefined)
    this.name = xml.text;
}

function RelatedFile(xml)
{
  if (xml == undefined)
    return null;
  this.fileName = makePath(xml.getAttribute("file_name"));
  //if (xml.hasAttribute("description"))
    this.description = xml.getAttribute("description");
  //if (xml.hasAttribute("spine_start_ref"))
    this.spineStartRef = xml.getAttribute("spine_start_ref");
  //if (xml.hasAttribute("spine_end_ref"))
    this.spineEndRef = xml.getAttribute("spine_end_ref");
}

function Tuplet(xml)
{
  if (xml == undefined)
    return null;
  this.enterNum = parseInt(xml.getAttribute("enter_num"));
  this.enterDen = parseInt(xml.getAttribute("enter_den"));
  //if (xml.hasAttribute("enter_dots"))
    this.enterDots = parseInt(xml.getAttribute("enter_dots"));
  this.inNum = parseInt(xml.getAttribute("in_num"));
  this.inDen = parseInt(xml.getAttribute("in_den"));
  //if (xml.hasAttribute("in_dots"))
    this.inDots = parseInt(xml.getAttribute("in_dots"));
}

function Notehead(xml)
{
  if (xml == undefined)
    return null;
  var pitch = xml.getElementsByTagName("pitch")[0];
  this.step = pitch.getAttribute("step");
  this.octave = parseInt(pitch.getAttribute("octave"));
  this.printedAccidentals = new Array();
  var printedAccidentals = xml.getElementsByTagName("printed_accidentals")[0];
  if (printedAccidentals != undefined)
  {
    printedAccidentals = printedAccidentals.getElementsByTagName("*");
    for (var i = 0; i < printedAccidentals.length; i++)
      this.printedAccidentals.push(printedAccidentals[i].nodeName);
  }
  this.actualAccidental = xml.getElementsByTagName("pitch")[0].getAttribute("actual_accidental");
  if (this.actualAccidental == null)
    this.actualAccidental = "natural";
  this.tie = (xml.getElementsByTagName("tie")[0] == undefined) ? false : true;
}

function ChordRest(xml)
{
  if (xml == undefined || xml.parentNode == undefined)
    return null;
  this.voice = xml.parentNode.getAttribute("voice_item_ref");
  this.durationNum = parseInt(xml.getElementsByTagName("duration")[0].getAttribute("num"));
  this.durationDen = parseInt(xml.getElementsByTagName("duration")[0].getAttribute("den"));
  var tuplet_ratio = xml.getElementsByTagName("tuplet_ratio")[0];
  if (tuplet_ratio != undefined)
    this.tuplet = new Tuplet(tuplet_ratio);
  var augmentationDots = xml.getElementsByTagName("augmentation_dots")[0];
  if (augmentationDots != undefined)
    this.augmentationDots = parseInt(augmentationDots.getAttribute("number"));
}

function Chord(xml)
{  
  // Call the parent constructor
  ChordRest.call(this, xml);
   
  this.noteheads = new Array();
  var noteheads = xml.getElementsByTagName("notehead");
  for (var i = 0; i < noteheads.length; i++)
    this.noteheads.push(new Notehead(noteheads[i]));
}
Chord.prototype = new ChordRest();
Chord.prototype.constructor = Chord;

function Rest(xml)
{
   // Call the parent constructor
   ChordRest.call(this, xml);
}
Rest.prototype = new ChordRest();
Rest.prototype.constructor = Rest;

function GraphicEvent(xml)
{
  if (xml == undefined)
    return null;
  this.x0 = parseFloat(xml.getAttribute("upper_left_x"));
  this.y0 = parseFloat(xml.getAttribute("upper_left_y"));
  this.x1 = parseFloat(xml.getAttribute("lower_right_x"));
  this.y1 = parseFloat(xml.getAttribute("lower_right_y"));
  //if (xml.hasAttribute("highlight_color"))
    this.highlightColor = xml.getAttribute("highlight_color");
  //if (xml.hasAttribute("description"))
    this.description = xml.getAttribute("description");
}

function GraphicInstance(xml)
{
  if (xml == undefined)
    return null;
  var base = this;
  this.positionInGroup = parseInt(xml.getAttribute("position_in_group"));
  this.fileName = makePath(xml.getAttribute("file_name"));
  //if (xml.hasAttribute("description"))
  this.description = xml.getAttribute("description");
  this.graphicEvents = new Array();
  var graphicEvents = xml.getElementsByTagName("graphic_event");
  for (var i = 0; i < graphicEvents.length; i++)
  {
    var key = graphicEvents[i].getAttribute("event_ref");
    if (this.graphicEvents[key] == undefined)
      this.graphicEvents[key] = new Array();
    this.graphicEvents[key].push(new GraphicEvent(graphicEvents[i]));
  }
  
  this.findGraphicEvents = function(posX, posY)
  {
    var result = new Array();
    var keys = Object.keys(base.graphicEvents);
    for (var i in keys)
      for (var j in base.graphicEvents[keys[i]])
      {
        var e = base.graphicEvents[keys[i]][j];
        if (posX >= e["x0"] && posX <= e["x1"] && posY >= e["y0"] && posY <= e["y1"])
          result.push(keys[i]);
      }
    return result;
  };
}

function Track(xml)
{
  function binarySearch(list, value)
  {
    function _binarySearch(list, value, start, stop)
    {
      var index = Math.floor((start + stop) / 2);
      if (start >= stop)
      {
        if (index <= 0)
          return list[0];
        var diff = list[index] - value;
        if (diff > 0)
          return list[index-1];
        return list[index];
      }
      if (value < list[index])
        return _binarySearch(list, value, start, index-1);
      if (value > list[index])
        return _binarySearch(list, value, index+1, stop);
      return list[index];
    }

    return _binarySearch(list, value, 0, list.length-1);
  }

  if (xml == undefined)
    return null;

  if (xml.getElementsByTagName("notes").length > 0) {
    if (xml.getElementsByTagName("notes")[0].textContent != undefined)
      this.notes = xml.getElementsByTagName("notes")[0].textContent;
    else
      this.notes = xml.getElementsByTagName("notes")[0].text;
  }
  
  this.performers = new Array();
  for (var i = 0; i < xml.getElementsByTagName("performer").length; i++) {
	var performer = xml.getElementsByTagName("performer")[i];
	if (performer.getAttribute("name") != undefined) {
		var string = performer.getAttribute("name");
		if (performer.getAttribute("type") != undefined)
			string += " (" + performer.getAttribute("type") + ")";
		this.performers.push(string);
	}
  }
  
  /*
  if (xml.getElementsByTagName("performer").length > 0) {
    if (xml.getElementsByTagName("performer")[0].getAttribute("name") != undefined)
      this.performer = xml.getElementsByTagName("performer")[0].getAttribute("name");
  }
  */
  
  this.fileFormat = xml.getAttribute("file_format");
  this.trackEventsByRef = new Array();
  this.trackEventsByTime = new Array();
  var trackEvents = xml.getElementsByTagName("track_event");
  for (var i = 0; i < trackEvents.length; i++)
  {
    var keyRef = trackEvents[i].getAttribute("event_ref");
    var startTime = trackEvents[i].getAttribute("start_time");
    var keyTime = parseFloat(startTime);
    
    if (keyTime % 1 == 0) 
      keyTime = keyTime - 0.001;
    
    this.trackEventsByRef[keyRef] = keyTime;

    if (this.trackEventsByTime[keyTime] == undefined)
      this.trackEventsByTime[keyTime] = new Array();
    this.trackEventsByTime[keyTime].push(trackEvents[i].getAttribute("event_ref"));
  }
  this.trackEventsByTime.sort(function(a, b) { return a - b; });

  this.searchByTime = function(timeToFind)
  {
    var time = binarySearch(Object.keys(this.trackEventsByTime), timeToFind);
    return this.trackEventsByTime[time];
  };
}

function Syllable(xml)
{
  if (xml == undefined)
    return null;
  this.startEventRef = xml.getAttribute("start_event_ref");
  this.endEventRef = xml.getAttribute("end_event_ref");
  this.hyphen = xml.getAttribute("hyphen");
  if (xml.textContent != undefined)
    this.text = xml.textContent;
  else if (xml.text != undefined)
    this.text = xml.text;
}

function Statistics(doc)
{
  this.numParts = doc.xmlDoc.getElementsByTagName("part").length;
  this.numEvents = doc.xmlDoc.getElementsByTagName("event").length;
  this.numChords = doc.xmlDoc.getElementsByTagName("chord").length;
  this.numRests = doc.xmlDoc.getElementsByTagName("rest").length;
  var nMeasures = doc.xmlDoc.getElementsByTagName("measure").length;
  this.numMeasures = nMeasures / doc.parts.length;
  this.numNotes = doc.xmlDoc.getElementsByTagName("notehead").length;
  
  // -----------------------------------
  // Pitch Class & MIDI Pitch & Quarter Lengths & Notes By Quarter Length and PC
  // -----------------------------------
  this.pitchClass = new Array();
  for (var i = 0; i < 12; i++)
    this.pitchClass[i] = 0;
	
  this.pitchClassWeighted = new Array();
  for (var i = 0; i < 12; i++)
    this.pitchClassWeighted[i] = 0;
	
  this.midiPitch = new Array();
  for (var i = 0; i < 128; i++)
    this.midiPitch[i] = 0;
	
  this.midiPitchWeighted = new Array();
  for (var i = 0; i < 128; i++)
    this.midiPitchWeighted[i] = 0;
	
  this.chordLength = new Array();
  this.chordLength[1 / 32] = 0;
  this.chordLength[8] = 0;
  
  this.noteLength = new Array();
  this.noteLength[1 / 32] = 0;
  this.noteLength[8] = 0;
  
  this.restLength = new Array();
  this.restLength[1 / 32] = 0;
  this.restLength[8] = 0;
  
  this.noteByLengthPC = new Array();

  for (var i in doc.rests) {
    var rest = doc.rests[i];
    if (this.restLength[rest.durationNum / rest.durationDen] == undefined)
      this.restLength[rest.durationNum / rest.durationDen] = 0;
    else
      this.restLength[rest.durationNum / rest.durationDen]++;
  }

  for (var i in doc.chords) {
    var chord = doc.chords[i];
    if (this.chordLength[4 * chord.durationNum / chord.durationDen] == undefined)
      this.chordLength[4 * chord.durationNum / chord.durationDen] = 1;
    else
      this.chordLength[4 * chord.durationNum / chord.durationDen]++;
	  
	  if (this.noteByLengthPC[4 * chord.durationNum / chord.durationDen] == undefined) {
      this.noteByLengthPC[4 * chord.durationNum / chord.durationDen] = new Array();
  	 	this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][0] = 0;
  		this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][1] = 0;
  		this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][2] = 0;
  		this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][3] = 0;
  		this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][4] = 0;
  		this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][5] = 0;
  		this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][6] = 0;
  		this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][7] = 0;
  		this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][8] = 0;
  		this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][9] = 0;
  		this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][10] = 0;
  		this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][11] = 0;
    }

    // TODO: gestire tuplets e aug_dots
    
    // var tuplet_ratio = xml.getElementsByTagName("tuplet_ratio")[0];
    // if (tuplet_ratio != undefined)
    //   this.tuplet = new Tuplet(tuplet_ratio);
    // var augmentationDots = xml.getElementsByTagName("augmentation_dots")[0];
    // if (augmentationDots != undefined)
    //   this.augmentationDots = parseInt(augmentationDots.getAttribute("number"));

    for (var j in doc.chords[i].noteheads) {
      var notehead = doc.chords[i].noteheads[j];
      if (this.noteLength[4 * chord.durationNum / chord.durationDen] == undefined)
        this.noteLength[4 * chord.durationNum / chord.durationDen] = 1;
      else
        this.noteLength[4 * chord.durationNum / chord.durationDen]++;
      if ((notehead.step == "C" && (notehead.actualAccidental == "none" || notehead.actualAccidental == "natural")) ||
        (notehead.step == "B" && notehead.actualAccidental == "sharp") ||
        (notehead.step == "D" && notehead.actualAccidental == "double_flat")) {
        this.pitchClass[0]++;
        this.midiPitch[12 * notehead.octave]++;
        this.pitchClassWeighted[0] += 4 * chord.durationNum / chord.durationDen;
        this.midiPitchWeighted[12 * notehead.octave] += 4 * chord.durationNum / chord.durationDen;
		    this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][0]++;
      }
      else if ((notehead.step == "C" && notehead.actualAccidental == "sharp") ||
        (notehead.step == "B" && notehead.actualAccidental == "double_sharp") ||
        (notehead.step == "D" && notehead.actualAccidental == "flat")) {
        this.pitchClass[1]++;
        this.midiPitch[1 + 12 * notehead.octave]++;
        this.pitchClassWeighted[1] += 4 * chord.durationNum / chord.durationDen;
        this.midiPitchWeighted[1 + 12 * notehead.octave] += 4 * chord.durationNum / chord.durationDen;
		    this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][1]++;
      }
      else if ((notehead.step == "D" && (notehead.actualAccidental == "none" || notehead.actualAccidental == "natural")) ||
        (notehead.step == "C" && notehead.actualAccidental == "double_sharp") ||
        (notehead.step == "E" && notehead.actualAccidental == "double_flat")) {
        this.pitchClass[2]++;
        this.midiPitch[2 + 12 * notehead.octave]++;
        this.pitchClassWeighted[2] += 4 * chord.durationNum / chord.durationDen;
        this.midiPitchWeighted[2 + 12 * notehead.octave] += 4 * chord.durationNum / chord.durationDen;
		    this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][2]++;
      }
      else if ((notehead.step == "D" && notehead.actualAccidental == "sharp") ||
        (notehead.step == "E" && notehead.actualAccidental == "flat") ||
        (notehead.step == "F" && notehead.actualAccidental == "double_flat")) {
        this.pitchClass[3]++;
        this.midiPitch[3 + 12 * notehead.octave]++;
        this.pitchClassWeighted[3] += 4 * chord.durationNum / chord.durationDen;
        this.midiPitchWeighted[3 + 12 * notehead.octave] += 4 * chord.durationNum / chord.durationDen;
		    this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][3]++;
      }
      else if ((notehead.step == "E" && (notehead.actualAccidental == "none" || notehead.actualAccidental == "natural")) ||
        (notehead.step == "D" && notehead.actualAccidental == "double_sharp") ||
        (notehead.step == "F" && notehead.actualAccidental == "flat")) {
        this.pitchClass[4]++;
        this.midiPitch[4 + 12 * notehead.octave]++;
        this.pitchClassWeighted[4] += 4 * chord.durationNum / chord.durationDen;
        this.midiPitchWeighted[4 + 12 * notehead.octave] += 4 * chord.durationNum / chord.durationDen;
		    this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][4]++;
      }
      else if ((notehead.step == "F" && (notehead.actualAccidental == "none" || notehead.actualAccidental == "natural")) ||
        (notehead.step == "E" && notehead.actualAccidental == "sharp") ||
        (notehead.step == "G" && notehead.actualAccidental == "double_flat")) {
        this.pitchClass[5]++;
        this.midiPitch[5 + 12 * notehead.octave]++;
        this.pitchClassWeighted[5] += 4 * chord.durationNum / chord.durationDen;
        this.midiPitchWeighted[5 + 12 * notehead.octave] += 4 * chord.durationNum / chord.durationDen;
		    this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][5]++;
      }
      else if ((notehead.step == "F" && notehead.actualAccidental == "sharp") ||
        (notehead.step == "G" && notehead.actualAccidental == "flat") ||
        (notehead.step == "E" && notehead.actualAccidental == "double_sharp")) {
        this.pitchClass[6]++;
        this.midiPitch[6 + 12 * notehead.octave]++;
        this.pitchClassWeighted[6] += 4 * chord.durationNum / chord.durationDen;
        this.midiPitchWeighted[6 + 12 * notehead.octave] += 4 * chord.durationNum / chord.durationDen;
		    this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][6]++;
      }
      else if ((notehead.step == "G" && (notehead.actualAccidental == "none" || notehead.actualAccidental == "natural")) ||
        (notehead.step == "F" && notehead.actualAccidental == "double_sharp") ||
        (notehead.step == "A" && notehead.actualAccidental == "double_flat")) {
        this.pitchClass[7]++;
        this.midiPitch[7 + 12 * notehead.octave]++;
        this.pitchClassWeighted[7] += 4 * chord.durationNum / chord.durationDen;
        this.midiPitchWeighted[7 + 12 * notehead.octave] += 4 * chord.durationNum / chord.durationDen;
		    this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][7]++;
      }
      else if ((notehead.step == "G" && notehead.actualAccidental == "sharp") ||
        (notehead.step == "A" && notehead.actualAccidental == "flat")) {
        this.pitchClass[8]++;
        this.midiPitch[8 + 12 * notehead.octave]++;
        this.pitchClassWeighted[8] += 4 * chord.durationNum / chord.durationDen;
        this.midiPitchWeighted[8 + 12 * notehead.octave] += 4 * chord.durationNum / chord.durationDen;
		    this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][8]++;
      }
      else if ((notehead.step == "A" && (notehead.actualAccidental == "none" || notehead.actualAccidental == "natural")) ||
        (notehead.step == "G" && notehead.actualAccidental == "double_sharp") ||
        (notehead.step == "B" && notehead.actualAccidental == "double_flat")) {
        this.pitchClass[9]++;
        this.midiPitch[9 + 12 * notehead.octave]++;
        this.pitchClassWeighted[9] += 4 * chord.durationNum / chord.durationDen;
        this.midiPitchWeighted[9 + 12 * notehead.octave] += 4 * chord.durationNum / chord.durationDen;
		    this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][9]++;
      }
      else if ((notehead.step == "A" && notehead.actualAccidental == "sharp") ||
        (notehead.step == "B" && notehead.actualAccidental == "flat") ||
        (notehead.step == "C" && notehead.actualAccidental == "double_flat")) {
        this.pitchClass[10]++;
        this.midiPitch[10 + 12 * notehead.octave]++;
        this.pitchClassWeighted[10] += 4 * chord.durationNum / chord.durationDen;
        this.midiPitchWeighted[10 + 12 * notehead.octave] += 4 * chord.durationNum / chord.durationDen;
		    this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][10]++;
      }
      else if ((notehead.step == "B" && (notehead.actualAccidental == "none" || notehead.actualAccidental == "natural")) ||
        (notehead.step == "A" && notehead.actualAccidental == "double_sharp") ||
        (notehead.step == "C" && notehead.actualAccidental == "flat")) {
        this.pitchClass[11]++;
        this.midiPitch[11 + 12 * notehead.octave]++;
        this.pitchClassWeighted[11] += 4 * chord.durationNum / chord.durationDen;
        this.midiPitchWeighted[11 + 12 * notehead.octave] += 4 * chord.durationNum / chord.durationDen;
		    this.noteByLengthPC[4 * chord.durationNum / chord.durationDen][11]++;
      }
    }
  }
}


// Properties of the IEEE1599Document:
// xmlDoc (Document): The XML file
// mainTitle (String): The main title
// authors (Array of Strings): List of all specified authors
// relatedFiles (Array of RelatedFiles): List of related files
// spineIds (Array of Strings): List of all the spine ids
// spineHash (Associative Array of Numbers): spineHash["ev#"] returns the position in the spine list of ev#
// voices (Array of Strings): List of all the voice names
// chords (Associative Array of Chords): chords["ev#"] returns the corresponding chord
// rests (Associative Array of Rests): rests["ev#"] returns the corresponding rest
// allHash (Associative Array of Chords and Rests): allHash["ev#"] returns the corresponding chord or rest
// graphicInstances (Associative Array of Associative Array of GraphicInstances):
//    graphicInstances["description"][page#] returns the corresponding GraphicInstance
// tracks (Associative Array of Tracks): tracks["filename"] returns the corresponding Track
function IEEE1599Document(url)
{
  this.xmlDoc = loadXMLDoc(url);
  // !!!!!
  this.xmlText = loadTextFile(url); 
  // !!!!!
  this.baseDir = splitPath(url).dirPart;
  
  // The following calls define properties of the 'this' object
  // Defines mainTitle, authors, relatedFiles
  parseGeneral(this);
  // Defines spineIds, spineHash
  parseSpine(this);
  // Defines voices, chords, rests, allHash
  parseLos(this);
  // Defines graphicInstances
  parseNotational(this);
  // Defines tracks
  parseAudio(this);
  // Statistics
  this.stats = new Statistics(this);
  
  function parseGeneral(doc)
  {
    if (doc.xmlDoc.getElementsByTagName("main_title")[0].textContent != undefined)
      doc.mainTitle = doc.xmlDoc.getElementsByTagName("main_title")[0].textContent;
    else
      doc.mainTitle = doc.xmlDoc.getElementsByTagName("main_title")[0].text;
	  
	if (doc.xmlDoc.getElementsByTagName("number").length > 0) {
      if (doc.xmlDoc.getElementsByTagName("number")[0].textContent != undefined)
        doc.number = doc.xmlDoc.getElementsByTagName("number")[0].textContent;
      else
        doc.number = doc.xmlDoc.getElementsByTagName("number")[0].text;
    }
    else
      doc.number = "";
	  
    if (doc.xmlDoc.getElementsByTagName("work_title").length > 0) {
      if (doc.xmlDoc.getElementsByTagName("work_title")[0].textContent != undefined)
        doc.workTitle = doc.xmlDoc.getElementsByTagName("work_title")[0].textContent;
      else
        doc.workTitle = doc.xmlDoc.getElementsByTagName("work_title")[0].text;
    }
    else
      doc.workTitle = "";
	  
    if (doc.xmlDoc.getElementsByTagName("work_number").length > 0) {
      if (doc.xmlDoc.getElementsByTagName("work_number")[0].textContent != undefined)
        doc.workNumber = doc.xmlDoc.getElementsByTagName("work_number")[0].textContent;
      else
        doc.workNumber = doc.xmlDoc.getElementsByTagName("work_number")[0].text;
    }
    else
      doc.workNumber = "";
	  
    doc.authors = new Array();
    var authors = doc.xmlDoc.getElementsByTagName("author");
    for (var i = 0; i < authors.length; i++)
      doc.authors.push(new Author(authors[i]));
    doc.relatedFiles = new Array();
    var relatedFiles = doc.xmlDoc.getElementsByTagName("related_file");
    for (var i = 0; i < relatedFiles.length; i++)
      doc.relatedFiles.push(new RelatedFile(relatedFiles[i]));
  }

  function parseSpine(doc)
  {
    var spine = doc.xmlDoc.getElementsByTagName("event");
    doc.spineIds = attributeArray(spine, "id");
    doc.spineHash = makeHash(spine, "id", function(i) { return i; }, true);
  }

  function parseLos(doc)
  {
    var partItems = doc.xmlDoc.getElementsByTagName("part");
    doc.parts = attributeArray(partItems, "id");
    var voiceItems = doc.xmlDoc.getElementsByTagName("voice_item");
    doc.voices = attributeArray(voiceItems, "id");
    var chordElements = doc.xmlDoc.getElementsByTagName("chord");
    var restElements = doc.xmlDoc.getElementsByTagName("rest");
    doc.chords = new Array();
    doc.rests = new Array();
    doc.chords = makeHash(chordElements, "event_ref", function(i) { return new Chord(chordElements[i]); }, true);
    doc.rests = makeHash(restElements, "event_ref", function(i) { return new Rest(restElements[i]); }, true);
    doc.allHash = new Array();
    doc.allHash = Object.extend(doc.allHash, doc.chords);
    doc.allHash = Object.extend(doc.allHash, doc.rests);
    // Lyrics
    var lyrics = doc.xmlDoc.getElementsByTagName("lyrics");
    doc.lyrics = new Array();
    doc.lyrics = makeHash(lyrics, "voice_ref", function() { return new Array(); }, true);
    for (var i = 0; i < lyrics.length; i++)
    {
      var syllables = lyrics[i].getElementsByTagName("syllable");
      for (var j = 0; j < syllables.length; j++)
        doc.lyrics[lyrics[i].getAttribute("voice_ref")][j] = new Syllable(syllables[j]);
    }
  }

  function parseNotational(doc)
  {
    var graphicInstances = doc.xmlDoc.getElementsByTagName("graphic_instance_group");
    doc.graphicInstances = new Array();
    doc.graphicInstances = makeHash(graphicInstances, "description", function() { return new Array(); }, true);
    for (var i = 0; i < graphicInstances.length; i++)
    {
      var pages = graphicInstances[i].getElementsByTagName("graphic_instance");
      for (var j = 0; j < pages.length; j++)
      {
        doc.graphicInstances[graphicInstances[i].getAttribute("description")][j] = new GraphicInstance(pages[j]);
        
        doc.graphicInstances[graphicInstances[i].getAttribute("description")][j].firstEventInPage = function()
        {
          var curPageEvents = Object.keys(this.graphicEvents);
          var minIndex = doc.spineIds.length;
          for (var key in curPageEvents)
          {
            var curIndex = doc.spineHash[curPageEvents[key]];
            if (curIndex < minIndex)
              minIndex = curIndex;
          }
          return doc.spineIds[minIndex];
        };
      }
    }
  }

  function parseAudio(doc)
  {
    var tracks = doc.xmlDoc.getElementsByTagName("track");
    doc.tracks = new Array();
    for (var i = 0; i < tracks.length; i++)
    {
      var key = makePath(tracks[i].getAttribute("file_name"));
      doc.tracks[key] = new Track(tracks[i]);
    }
  }

  function makeHash(collection, keyAttribute, valueFunction, isUnique)
  {
    var result = new Array();
    for (var i = 0; i < collection.length; i++)
    {
      var key = collection[i].getAttribute(keyAttribute);
      var value = valueFunction(i);
      if (isUnique)
        result[key] = value;
      else
      {
        if (result[key] == undefined)
          result[key] = new Array();
        result[key].push(value);
      }
    }
    return result;
  }
}