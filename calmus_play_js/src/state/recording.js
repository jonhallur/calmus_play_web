/**
 * Created by jonh on 26.9.2016.
 */
import {State} from 'jumpsuit'
import WebMidi from 'webmidi'
import MidiEvent from '../pojos/midievent'
import * as clickTrack from '../pojos/metronome'
import soundfonts from './soundfont'
import {setInputCell} from './inputcell'

var recordingStartTime = 0;

const recording = State('recording', {
  initial: {
    isRecording: false,
    metronome: true,
    intervalTime: 500,
    tempo: 120,
    inputHandle: '',
    noteOns: [],
    noteOffs: [],
    ready: false,
    eventList: []
  },

  setKeyValue: (state, payload) => ({
    [payload.key]: payload.value
  }),

  setIsRecording: (state, payload) => ({
    isRecording: payload
  }),

  setMetronome: (state, payload) => ({
    metronome: payload
  }),

  setIntervalId: (state, payload) => ({
    intervalId: payload
  }),

  setTempo: (state, payload) => ({
    tempo: payload,
    intervalId: 60 / payload
  }),

  setInputHandle: (state, payload) => ({
    inputHandle: payload
  }),

  addNoteOn: (state, payload) => ({
    noteOns: [...state.noteOns, payload]
  }),

  addNoteOff: (state, payload) => ({
    noteOffs: [...state.noteOffs, payload]
  }),

  setReady: (state, payload) => ({
    ready: payload
  }),

  setEventList: (state, payload) => ({
    eventList: payload
  }),

  clearRecording: (state, payload) => ({
    noteOns: [],
    noteOffs: []
  })
});

export default recording

export function startRecording(tempo, metronome, in_id) {
  let {translator} = soundfonts.getState();
  recordingStartTime = WebMidi.time;
  if(metronome) {
    clickTrack.play(tempo);
  }
  let input = WebMidi.getInputById(in_id);
  input.addListener(
    'noteon',
    'all',
    function(e) {
      //console.log("noteon", e.note, WebMidi.time - recordingStartTime);
      recording.addNoteOn({note: e.note.number, time: (WebMidi.time - recordingStartTime), velocity: e.velocity});
      translator.send(e.data);
    });
  input.addListener(
    'noteoff',
    'all',
    function(e) {
      //console.log("noteoff", e.note, WebMidi.time - recordingStartTime);
      recording.addNoteOff({note: e.note.number, time: (WebMidi.time - recordingStartTime)});
      translator.send(e.data);
    }
  );
  recording.setInputHandle(input);
  recording.setIsRecording(true);
  recording.setReady(false);
}

export function stopRecording(inputHandle, noteOns, noteOffs, metronome) {
  if(metronome) {
    clickTrack.play(120);
  }
  let recEndTime = WebMidi.time - recordingStartTime;
  inputHandle.removeListener('noteon');
  inputHandle.removeListener('noteoff');
  recording.setIsRecording(false);
  recording.setInputHandle('');
  recording.setEventList([]);
  if(noteOns.length === 0) {
    recording.clearRecording();
    NotificationManager.info("Nothing was recorded", "Recorder");
    return;
  }
  let eventList = [];
  for(let noteon of noteOns) {
    let noteNumber = noteon.note;
    let duration = 0;
    for(let i=0; i<noteOffs.length; i++) {
      let noteoff = noteOffs[i];
      if(noteNumber === noteoff.note) {
        duration = noteoff.time - noteon.time;
        eventList.push(
          new MidiEvent(
            noteon.time,
            1,
            noteon.note,
            duration,
            Math.round(noteon.velocity*127)
          )
        );
        noteOffs.splice(i, 1);
        break;
      }
    }
    if (duration === 0) {
      console.log(noteon.time);
      console.log(recEndTime);
      duration = recEndTime - noteon.time;
      eventList.push(
        new MidiEvent(
          noteon.time,
          1,
          noteon.note,
          duration,
          Math.round(noteon.velocity*127)
        )
      );
    }

  }
  if (eventList.length > 0) {
    recording.setEventList(eventList);
    setInputCell(eventList);
    recording.setReady(true);
  }
  recording.clearRecording();
}