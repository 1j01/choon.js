
global = window;

AudioContext = global.AudioContext || global.webkitAudioContext;

var REST = null;

$(function(){
	
	var $prog = $("textarea");
	var $output = $("output");
	var output = function(_){$output.text(_).removeClass("error");};
	var error = function(_){$output.text(_).addClass("error");};
	onerror = error;
	
	var smooth = true;
	var noteLength = 10/1000;
	$("[value=smooth]").prop("checked",true);
	$(":radio").on("change",function(){
		smooth = $("[value=smooth]").is(":checked");
		console.log(smooth);
	});
	$("#note-length").on("change now",function(){
		noteLength = Number($("#note-length").val()) / 1000;
	}).triggerHandler("now");
	
	var actx, osc, gain;
	if(AudioContext){
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
	}else{
		error("No AudioContext! This will be boring.");
	}
	//$prog.on("change",
	$("#play").on("click", function(){
		try{
			var prog = $prog.val();
			var song = choon(prog);
			output("");
			play(song);
		}catch(e){
			error(e);
		}
	});
	$("#stop").on("click", function(){
		stop();
	});
	
	function play(song){
		stop();
		var songStartTime = actx.currentTime;
		var base = 440;//A
		for(var i=0; i<=song.length; i++){
			var t = songStartTime + i * noteLength;
			var note = song[i];
			if(note == REST){
				if(smooth){
					gain.gain.linearRampToValueAtTime(0, t + noteLength*0.2);
				}else{
					gain.gain.setValueAtTime(0, t + noteLength*0.2);
				}
			}else{
				var freq = Math.pow(2, Math.log(base) / Math.LN2 + note/12);
				if(smooth){
					osc.frequency.exponentialRampToValueAtTime(freq, t);
					gain.gain.linearRampToValueAtTime(1, t);
				}else{
					osc.frequency.setValueAtTime(freq, t);
					gain.gain.setValueAtTime(1, t);
				}
			}
		}
	}
	function stop(){
		osc.frequency.cancelScheduledValues(actx.currentTime);
		gain.gain.cancelScheduledValues(actx.currentTime);
		gain.gain.setValueAtTime(0,actx.currentTime);
	}
	
});
