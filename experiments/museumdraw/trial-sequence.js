/* 

Handles dynamic elements of museumdraw task
Oct 26 2017

*/
curTrial=0 // global variable

$(document).ready(function() {	
	console.log('document ready');
})

$('#ready').click(function(){
		console.log('clicked ready button');
        setTimeout(function() {showCue();},1000);
        setTimeout(function() {hideCue();},4000); 
        setTimeout(function() {showSubmit();},8000);
		timestamp_cueOnset = new Date().getTime();
})
 

function showCue() {
	$('#ready').fadeOut('fast');
	$('#cue').fadeIn('fast'); //text cue associated with trial
	$('#cueVideo').show(); //show video html - this can be a variable later?
	playVideo();
}

function hideCue() {
	$('#cue').fadeOut('fast'); // fade out cue
	$('#cueVideo').hide(); //show video html - this can be a variable later?
	$('#sketchpad').fadeIn('fast'); // fade in sketchpad  here?
}

function showSubmit() {
	$('#submit').fadeIn('fast');
}

// video player functions
function playVideo(){
  videojs("cueVideo").ready(function(){
  var myPlayer = this;
  myPlayer.play();
	});
}


function loadNextVideo(){
  var player=videojs('cueVideo');
  player.pause();
  console.log(stimListTest[curTrial].video)
  player.src({ type: "video/mp4", src: "videos/" + stimListTest[curTrial].video });
  player.load();
}


function nextTrial() {
	curTrial++
	console.log('clicked submit');
	loadNextVideo(curTrial)
	document.getElementById("cue").innerHTML = "Can you draw a "  + stimListTest[curTrial].category;

	// CLEAR SKETCHPAD AND LOAD DATA //
	$('#submit').fadeOut('fast'); // fade out submit button
	$('#ready').fadeIn('fast'); // fade in ready
	// GET NEXT CUE AND VIDEO //
}





