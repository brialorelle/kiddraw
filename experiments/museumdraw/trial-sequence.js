/* 

Handles dynamic elements of museumdraw task
Oct 26 2017

*/

// To integrate:
// HTML divs: Starting welcome page, age page (push age data), thank you page
// JS: clear and save sketchpad data (and push to online database after each trial)
// Convert onclick to also ontouch to work with ipad
// CSS: Make sure sizing works well on an iPad
// and much more...

curTrial=0 // global variable, trial counter
maxTrials=4 // could come from settings file of some kind, hard coded for now.

$(document).ready(function() {	
	console.log('document ready');
})

function startExp(){
	$('#Welcome').fadeOut('fast'); // hide intro screen
	$('#getAge').fadeIn('fast'); // fade in ready button
}

function endExp(){
	$('#mainExp').fadeOut('fast'); 
	$('#Thanks').fadeIn('fast'); // hide intro screen
}

function startDrawing(){
	$('#getAge').fadeOut('fast'); // fade in ready button
	$('#mainExp').fadeIn('fast'); // fade in ready button
	$('#ready').fadeIn('fast'); // fade in ready button
}

$('#ready').click(function(){
		console.log('clicked ready button');
		$('#ready').fadeOut('fast');
		$('#allDone').fadeOut('fast');
        setTimeout(function() {showCue();},1000); 
        setTimeout(function() {hideCue();},4000);  // Take cues away after 4s?
        setTimeout(function() {showSubmit();},8000); // some minimum amount of time before "I'm done button"
		timestamp_cueOnset = new Date().getTime();
})

$('#allDone').click(function(){
		console.log('clicked all done');
		$('#ready').fadeOut('fast');
		$('#allDone').fadeOut('fast');
        endExp();
})
 
function showCue() {
	
	$('#cue').fadeIn('fast'); //text cue associated with trial
	$('#cueVideoDiv').show(); //show video div 
	playVideo();
}

function hideCue() {
	$('#cue').fadeOut('fast'); // fade out cue
	$('#cueVideoDiv').hide(); //show video html - this can be a variable later?
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
	$('#sketchpad').fadeOut('fast'); // fade out sketchpas before choice buttons
	if (curTrial<maxTrials){
		loadNextVideo(curTrial)
		document.getElementById("cue").innerHTML = "Can you draw a "  + stimListTest[curTrial].category;
		// data.sketchData = GET SKETCHPAD DATA
		// data.category = category
		// data.video = video
		// data.submitTime?
		// CLEAR SKETCHPAD 
		$('#submit').fadeOut('fast'); // fade out submit button
		$('#ready').fadeIn('fast'); // fade in ready
		$('#allDone').fadeIn('fast'); 
		// GET NEXT CUE AND VIDEO //
	}
	else {
		endExperiment();
	}

}





