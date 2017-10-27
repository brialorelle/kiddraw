/* 

Handles dynamic elements of museumdraw task
Oct 26 2017

*/

// To integrate:
// HTML divs: Starting welcome page, age page (push age data), thank you page
// JS: ifthen: Do you want to draw more? If no, thank you page, If yes, check curTrial relative to maxTrials.
// JS: clear and save sketchpad data (and push to online database after each trial)
// and much more...

curTrial=0 // global variable, trial counter

$(document).ready(function() {	
	console.log('document ready');
})

$('#ready').click(function(){
		console.log('clicked ready button');
        setTimeout(function() {showCue();},1000); 
        setTimeout(function() {hideCue();},4000);  // Take cues away after 4s?
        setTimeout(function() {showSubmit();},8000); // some minimum amount of time before "I'm done button"
		timestamp_cueOnset = new Date().getTime();
})
 
function showCue() {
	$('#ready').fadeOut('fast');
	$('#cue').fadeIn('fast'); //text cue associated with trial
	$('#cueVideo').show(); //show video div 
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
  videojs("cueVideo").ready(function(){ // need to wait until video is ready
  var player = this;
  player.play();
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
	// data.sketchData = GET SKETCHPAD DATA
	// data.category = category
	// data.video = video
	// data.submitTime?
	// CLEAR SKETCHPAD 
	$('#submit').fadeOut('fast'); // fade out submit button
	$('#ready').fadeIn('fast'); // fade in ready
	// GET NEXT CUE AND VIDEO //
}





