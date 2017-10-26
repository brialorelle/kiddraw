/* 

Handles dynamic elements of museumdraw task
Oct 26 2017

*/

$(document).ready(function() {	

	console.log('document ready');
	$('#ready').click(function(){	
		console.log('clicked ready button');
        setTimeout(function() {showCue();},1000); 
        setTimeout(function() {hideCue();},2000); 
		timestamp_cueOnset = new Date().getTime();
	})

	function showCue() {
		$('#ready').fadeOut('fast');
		$('#cue').fadeIn('fast');
	}

	function hideCue() {
		$('#cue').fadeOut('fast');
		$('#ready').fadeIn('fast');	
	}

	function showSubmit() {
		$('#submit').fadeIn('fast');
	}

	function showSlide(id) {
	  // Hide all slides
	  $(".slide").hide();
	  // Show just the slide we want to show
	  $("#"+id).show();
	}

});




