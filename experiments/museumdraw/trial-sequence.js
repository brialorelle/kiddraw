/* 

Handles dynamic elements of museumdraw task
Oct 26 2017

*/

$(document).ready(function() {	
	console.log('document ready');
})

$('#ready').click(function(){	
		console.log('clicked ready button');
        setTimeout(function() {showCue();},1000);
        setTimeout(function() {hideCue();},4000); 
        setTimeout(function() {showSubmit();},10000);
		timestamp_cueOnset = new Date().getTime();
})

function showCue() {
	$('#ready').fadeOut('fast');
	$('#cue').fadeIn('fast'); //text cue associated with trial
	$('#cueVideo').show(); //show video html - this can be a variable later?
	videojs('cueVideo').play(); //get the video element and play it
}

function hideCue() {
	$('#cue').fadeOut('fast'); // fade out cue
}

function showSubmit() {
	$('#submit').fadeIn('fast');
}

function nextTrial() {
	console.log('clicked submit');
	// CLEAR SKETCHPAD AND LOAD DATA //
	$('#submit').fadeOut('fast'); // fade out submit button
	$('#ready').fadeIn('fast'); // fade in ready
	// LOG DATA SOMEHOW //
	// GET NEXT CUE AND VIDEO //
}





