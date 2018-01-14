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
    volumeDisplay = $('#volume-display'),
    volumeUpButton = $('#volume-up-button'),
    volumeDownButton = $('#volume-down-button'),
    startButton = $('#start-button'),
    stopButton = $('#stop-button');

  tempoField.value = tempo;
  tempoField.addEventListener('change', e => {
    const newTempo = parseFloat(e.target.value);
    if (!isNaN(newTempo)) {
      // TODO other checks
      tempo = newTempo;
    }
  });

  tempoUpButton.addEventListener('click', e => {
    // TODO check range
    tempo++;
    tempoField.value = tempo;
  });

  tempoDownButton.addEventListener('click', e => {
    // TODO check range
    tempo--;
    tempoField.value = tempo;
  });

  startButton.addEventListener('click', e => {
    e.preventDefault();
    startButton.classList.toggle('hidden');
    stopButton.classList.toggle('hidden');
    start();
  });

  stopButton.addEventListener('click', e => {
    e.preventDefault();
    startButton.classList.toggle('hidden');
    stopButton.classList.toggle('hidden');
    start();
  });

  volumeUpButton.addEventListener('click', e => {
    e.preventDefault();
    volume = Math.min(volume + 0.1, 1.0);
    volumeDisplay.innerText = `${Math.round(volume * 100)}%`;
  });

  volumeDownButton.addEventListener('click', e => {
    e.preventDefault();
    volume = Math.max(volume - 0.1, 0);
    volumeDisplay.innerText = `${Math.round(volume * 100)}%`;
  });
}

window.addEventListener('load', init);
