var audioContext = null;
var isPlaying = false;
var tempo = 120.0;
var volume = 1.0;
var nextNoteTime = 0.0;
var timerWorker = null;

function nextNote() {
  nextNoteTime += 60.0 / tempo;
}

function scheduleNote(time) {
  const gain = audioContext.createGain();
  gain.gain.value = volume;

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
    return 'stop';
  } else {
    timerWorker.postMessage('stop');
    return 'start';
  }
}

function init() {
  audioContext = new AudioContext();
  timerWorker = new Worker('metronomeworker.js');

  timerWorker.onmessage = e => {
    if (e.data == 'tick') {
      scheduler();
    }
  };
  timerWorker.postMessage({interval: 25.0});

  const tempoField = document.querySelector('#tempo');
  tempoField.value = tempo;
  tempoField.addEventListener('change', e => {
    const newTempo = parseFloat(e.target.value);
    if (!isNaN(newTempo)) {
      // TODO other checks
      tempo = newTempo;
    }
  });

  const volumeField = document.querySelector('#volume-field');

  const volumeUpButton = document.querySelector('#volume-up-button');
  volumeUpButton.addEventListener('click', e => {
    e.preventDefault();
    volume = Math.min(volume + 0.1, 1.0);
    volumeField.value = volume;
  });

  const volumeDownButton = document.querySelector('#volume-down-button');
  volumeDownButton.addEventListener('click', e => {
    e.preventDefault();
    volume = Math.max(volume - 0.1, 0);
    volumeField.value = volume;
  });
}

window.addEventListener('load', init);
