// Choon interpreter

choon = function(prog){
	var REST = null;
	
	var tokens = [];
	var tokenizer = /([A-G][#b]?)|([~%?\-+.])|(=?[a-z]+)|(=[-\d]\d*)|(:\|\|)|(\|\|:)|(\/\/.*)/gm;
	prog.replace(tokenizer, function(m){
		tokens.push(m);
	});
	var transpose = 0;
	var lastVal = 0;
	var output = [];
	var repeatStarts = [];
	var repeatCounts = [];
	var markers = {};
	var lastMarker = {};
	var inCounts; // TODO: initial value? not sure what this variable is, but it was accidentally global before

	var tokenIndex = 0;
	while(tokens[tokenIndex]){
		var t = tokens[tokenIndex];
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
			lastVal = val + transpose;
			output.push(lastVal);
		}else if(t.match(/^[a-z]+/)){
			if(markers[t]){ // save for the x=x case
				lastMarker = {t: markers[t]};
			}
			markers[t] = output.length;
		}else if(t.match(/^=-?\d+/)){
			var tp = t.substr(1);//t[1..-1]
			lastVal = output[tp-1] + transpose;
			output.push(lastVal);
		}else if(t.match(/^=[a-z]+/)){
			var tp = t.substr(1);//t[1..-1]
			var m = markers[tp];
			if(m && m < output.length){
				lastVal = output[m] + transpose;
			}else if(lastMarker[tp]){
				lastVal = output[lastMarker[tp]] + transpose;
			}else{
				throw new Error('Marker "'+tp+'" was used before being set.');
			}
			output.push(lastVal);
		}else{
			switch(t){
				case "-":
					if(lastVal) transpose -= lastVal;
					break;
				case "+":
					if(lastVal) transpose += lastVal;
					break;
				case ".":
					transpose = 0;
					break;
				case "||:":
					if(lastVal == REST || lastVal > 0){
						repeatStarts.push(tokenIndex);
						repeatCounts.push(lastVal?lastVal:-1);// nil means forever (what does that mean?)
					}else{ // jump to end of this repeat
						inCounts = 1;
						while(tokens[tokenIndex] && inCounts > 0){
							while(tokens[tokenIndex] && tokens[tokenIndex] != ":||"){
								if(tokens[tokenIndex] == "||:"){
									inCounts++;
								}
								tokenIndex++;
							}
							inCounts--;
						}
					}
					break;
				case ":||":
					repeatCounts[repeatCounts.length-1]--;
					if(repeatCounts[repeatCounts.length-1] == 0){
						repeatStarts.pop();
						repeatCounts.pop();
					}else{
						tokenIndex = repeatStarts[repeatStarts.length-1];
					}
					break;
				case "~":
					if(lastVal == 0){
						inCounts = 1;
						while(tokens[tokenIndex] && inCounts > 0){
							while(tokens[tokenIndex] && tokens[tokenIndex] != ":||"){
								if(tokens[tokenIndex] == "||:"){
									inCounts++;
								}
								tokenIndex++;
							}
							inCounts--;
						}
						repeatStarts.pop();
						repeatCounts.pop();
					}
					break;
				case "%":
					output.push(REST);
					lastVal = REST;
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
					lastVal = output[output.length-1];
					break;
			} // end switch
		}
		tokenIndex++;
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