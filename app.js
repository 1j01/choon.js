
global = window;

AudioContext = global.AudioContext || global.webkitAudioContext;

var REST = null;

window.addEventListener("DOMContentLoaded", function () {

	var $playButton = document.getElementById("play");
	var $stopButton = document.getElementById("stop");
	var $prog = document.querySelector("textarea");
	var $output = document.querySelector("output");
	var $smoothRadio = document.querySelector("input[value=smooth]");
	var $radios = document.querySelectorAll("input[name=sound]");
	var $noteLength = document.getElementById("note-length");

	var output = function (message) { $output.textContent = message; $output.classList.remove("error"); };
	var error = function (message) { $output.textContent = message; $output.classList.add("error"); };
	onerror = error;

	var smooth = true;
	var noteLength = 10 / 1000;
	$smoothRadio.checked = true;
	for (var i = 0; i < $radios.length; i++) {
		$radios[i].addEventListener("change", function () {
			smooth = $smoothRadio.checked;
		});
	}
	function updateNoteLength() {
		noteLength = Number($noteLength.value) / 1000;
	}
	updateNoteLength();
	$noteLength.addEventListener("change", updateNoteLength);

	var actx, osc, gain;

	//$prog.addEventListener("change",
	$playButton.addEventListener("click", function () {
		try {
			var prog = $prog.value;
			var song = choon(prog);
			output("");
			play(song);
		} catch (e) {
			error(e);
		}
	});
	$stopButton.addEventListener("click", function () {
		stop();
	});

	function initAudio() {
		if (actx) {
			return true;
		}
		if (AudioContext) {
			actx = new AudioContext();

			volume = actx.createGain();
			volume.connect(actx.destination);
			volume.gain.value = 0.1;

			gain = actx.createGain();
			gain.connect(volume);
			gain.gain.value = 0;

			osc = actx.createOscillator();
			osc.start(0);
			osc.connect(gain);

			return true;
		} else {
			error("No AudioContext! This will be boring.");
			return false;
		}
	}

	function play(song) {
		if (!initAudio()) return;
		stop();
		var songStartTime = actx.currentTime;
		var base = 440;//A
		for (var i = 0; i <= song.length; i++) {
			var t = songStartTime + i * noteLength;
			var note = song[i];
			if (note == REST) {
				if (smooth) {
					gain.gain.linearRampToValueAtTime(0, t + noteLength * 0.2);
				} else {
					gain.gain.setValueAtTime(0, t + noteLength * 0.2);
				}
			} else {
				var freq = Math.pow(2, Math.log(base) / Math.LN2 + note / 12);
				if (smooth) {
					osc.frequency.exponentialRampToValueAtTime(freq, t);
					gain.gain.linearRampToValueAtTime(1, t);
				} else {
					osc.frequency.setValueAtTime(freq, t);
					gain.gain.setValueAtTime(1, t);
				}
			}
		}
	}
	function stop() {
		osc.frequency.cancelScheduledValues(actx.currentTime);
		gain.gain.cancelScheduledValues(actx.currentTime);
		gain.gain.setValueAtTime(0, actx.currentTime);
	}

});
