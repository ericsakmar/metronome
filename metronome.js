var audioContext = null;
var isPlaying = false;
var tempo = 120.0;
var volume = 100;
var nextNoteTime = 0.0;
var timerWorker = null;

function nextNote() {
  nextNoteTime += 60.0 / tempo;
}

function scheduleNote(time) {
  const gain = audioContext.createGain();
  gain.gain.value = volume / 100;

  const osc = audioContext.createOscillator();
  osc.connect(gain);
  osc.frequency.value = 440.0;
  gain.connect(audioContext.destination);

  osc.start(time);
  osc.stop(time + 0.05);
}

function scheduler() {
  while (nextNoteTime < audioContext.currentTime + 0.1) {
    scheduleNote(nextNoteTime);
    nextNote();
  }
}

function start() {
  isPlaying = !isPlaying;

  if (isPlaying) {
    nextNoteTime = audioContext.currentTime;
    timerWorker.postMessage('start');
  } else {
    timerWorker.postMessage('stop');
  }
}

function init() {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  audioContext = new AudioContext();
  timerWorker = new Worker('metronomeworker.js');

  timerWorker.onmessage = e => {
    if (e.data == 'tick') {
      scheduler();
    }
  };
  timerWorker.postMessage({interval: 25.0});

  const $ = document.querySelector.bind(document),
    tempoField = $('#tempo'),
    tempoUpButton = $('#tempo-up-button'),
    tempoDownButton = $('#tempo-down-button'),
    volumeField = $('#volume'),
    volumeUpButton = $('#volume-up-button'),
    volumeDownButton = $('#volume-down-button'),
    startButton = $('#start-button'),
    stopButton = $('#stop-button');

  volumeField.value = volume;
  tempoField.value = tempo;

  tempoField.addEventListener('change', e => setTempo(e.target.value));
  tempoUpButton.addEventListener('click', e => setTempo(tempo + 5));
  tempoDownButton.addEventListener('click', e => setTempo(tempo - 5));

  function setTempo(rawTempo) {
    let newTempo = parseFloat(rawTempo);
    if (!isNaN(newTempo)) {
      newTempo = newTempo;
      newTempo = Math.max(20, newTempo);
      newTempo = Math.min(newTempo, 400);
      tempo = newTempo;
    }
    tempoField.value = Math.round(tempo);
  }

  startButton.addEventListener('click', e => toggle());
  stopButton.addEventListener('click', e => toggle());

  function toggle() {
    startButton.classList.toggle('hidden');
    stopButton.classList.toggle('hidden');
    start();
  }

  volumeField.addEventListener('change', e => setVolume(e.target.value));
  volumeUpButton.addEventListener('click', e => setVolume(volume + 5));
  volumeDownButton.addEventListener('click', e => setVolume(volume - 5));

  function setVolume(rawVolume) {
    let newVolume = parseFloat(rawVolume);
    if (!isNaN(newVolume)) {
      newVolume = newVolume;
      newVolume = Math.max(0, newVolume);
      newVolume = Math.min(newVolume, 100);
      volume = newVolume;
    }
    volumeField.value = Math.round(volume);
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

window.addEventListener('load', init);
