# script che estrapola i tempi degli onset da un file MIDI
import numpy as np
from mido import MidiFile

def extract_times(midi_filename):

    midi_file = MidiFile(midi_filename)
    events = [event.dict() for event in midi_file if event.type == 'note_on']

    # converto i delta di tempo in tempi relativi 
    cur_time = 0
    for e in events:
        e['time'] += cur_time
        cur_time = e['time']

    # gli eventi di note_on con velocity 0 sono eventi di note_off
    events = [e for e in events if e['velocity'] != 0]

    onset_times = sorted(list({e['time'] for e in events}))
    return np.round(np.array(onset_times), 3)

if __name__ == "__main__":
    onset_times = extract_times('filename.mid')
