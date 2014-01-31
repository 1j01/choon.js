// Choon interpreter

choon = function(prog){
	var REST = null;
	
	var tokens = [];
	var tokenizer = /([A-G][#b]?)|([~%?\-+.])|(=?[a-z]+)|(=[-\d]\d*)|(:\|\|)|(\|\|:)|(\/\/.*)/gm;
	prog.replace(tokenizer, function(m){
		tokens.push(m);
	});
	var transpose = 0;
	var lastval = 0;
	var output = [];
	var repeatstarts = [];
	var repeatcounts = [];
	var markers = {};
	var lastmarker = {};

	var tokeni = 0;
	while(tokens[tokeni]){
		var t = tokens[tokeni];
		if(t.match(/^[A-G]/)){
			var val = "C-D-EF-G-A-B".indexOf(t[0]) - 9;
			if(t[1]){
				if(t[1] == "#"){
					if(val == 2){
						val = -9;
					}else{
						val += 1;
					}
				}else if(t[1] == "b"){
					if(val == -9){
						val = 2;
					}else{
						val -= 1;
					}
				}
			}
			lastval = val + transpose;
			output.push(lastval);
		}else if(t.match(/^[a-z]+/)){
			if(markers[t]){ // save for the x=x case
				lastmarker = {t: markers[t]};
			}
			markers[t] = output.length;
		}else if(t.match(/^=-?\d+/)){
			var tp = t.substr(1);//t[1..-1]
			lastval = output[tp-1] + transpose;
			output.push(lastval);
		}else if(t.match(/^=[a-z]+/)){
			var tp = t.substr(1);//t[1..-1]
			var m = markers[tp];
			if(m && m < output.length){
				lastval = output[m] + transpose;
			}else if(lastmarker[tp]){
				lastval = output[lastmarker[tp]] + transpose;
			}else{
				throw new Error('Marker "'+tp+'" was used before being set.');
			}
			output.push(lastval);
		}else{
			switch(t){
				case "-":
					if(lastval) transpose -= lastval;
					break;
				case "+":
					if(lastval) transpose += lastval;
					break;
				case ".":
					transpose = 0;
					break;
				case "||:":
					if(lastval == REST || lastval > 0){
						repeatstarts.push(tokeni);
						repeatcounts.push(lastval?lastval:-1);// nil means forever (what does that mean?)
					}else{ // jump to end of this repeat
						incounts = 1;
						while(tokens[tokeni] && incounts > 0){
							while(tokens[tokeni] && tokens[tokeni] != ":||"){
								if(tokens[tokeni] == "||:"){
									incounts++;
								}
								tokeni++;
							}
							incounts--;
						}
					}
					break;
				case ":||":
					repeatcounts[repeatcounts.length-1]--;
					if(repeatcounts[repeatcounts.length-1] == 0){
						repeatstarts.pop();
						repeatcounts.pop();
					}else{
						tokeni = repeatstarts[repeatstarts.length-1];
					}
					break;
				case "~":
					if(lastval == 0){
						incounts = 1;
						while(tokens[tokeni] && incounts > 0){
							while(tokens[tokeni] && tokens[tokeni] != ":||"){
								if(tokens[tokeni] == "||:"){
									incounts++;
								}
								tokeni++;
							}
							incounts--;
						}
						repeatstarts.pop();
						repeatcounts.pop();
					}
					break;
				case "%":
					output.push(REST);
					lastval = REST;
					break;
				case "?":
					var used = [];
					while(used.length < 12){
						var n = rand(12) - 9 + transpose;
						if(used.indexOf(n) == -1){
							used.push(n);
							output.push(n);
						}
					}
					lastval = output[output.length-1];
					break;
			} // end switch
		}
		tokeni++;
	}
	
	/*Original output method:
		var s = ">5000";
		output.forEach(function(n){
			s += "\nT100;"+(n==REST?"":n);
		});
		return s + ".\n";
	*/

	return output;


	function rand(max){
		return(Math.random()*max)|0;
	}
};