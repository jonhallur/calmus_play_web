/**
 * Created by jonh on 13.11.2016.
 */
import {State} from 'jumpsuit'
import uistate from './ui'
import audio_context from 'audio-context'

const features = State('features',{
  initial: {
    midi: false,
    ios: false,
    ogg: false,
  },

  setKeyValue: (state, payload) => ({
    [payload.key]: payload.value
  })
});

export default features

export function featureDiscovery() {
  if (iOS()) {
    features.setKeyValue({key:'ios', value: true});
  }
  if (Ogg()) {
    features.setKeyValue({key:'ogg', value: true})
  }
}

function iOS() {

  var iDevices = [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ];

  if (!!navigator.platform) {
    while (iDevices.length) {
      if (navigator.platform === iDevices.pop()){ return true; }
    }
  }
  return false;
}

function Ogg() {
  let audio = document.createElement('audio');
  let canPlayOgg = audio.canPlayType('audio/ogg; codecs="vorbis"');
  var result = (canPlayOgg === 'probably');
  return result;
}