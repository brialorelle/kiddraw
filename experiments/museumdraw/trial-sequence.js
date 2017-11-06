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

// 0. Load dependencies
paper.install(window);

socket = io.connect();

// 1. Setup trial order and randomize it!

var stimListTest = [{"category": "rabbit"},
			{"category": "cat"},
			{"category": "chair"},
			{"category": "couch"},
      {"category": "banana"},
      {"category": "phone"},
      {"category": "cup"},
      {"category": "foot"},
      {"category": "ice cream"},
      {"category": "frog"},
      {"category": "carrot"},
      {"category": "flower"},
      {"category": "cup"},
      {"category": "train"},
      {"category": "boat"},
      {"category": "car"},
			]

var curTrial=0 // global variable, trial counter
var sessionId='pilot0_' + Date.now().toString()
var maxTrials = stimListTest.length-1; // 
var trialOrder = [];
for (var i = 0; i <= maxTrials; i++) {
   trialOrder.push(i);
}

//helpfuls
function shuffle (a) 
{ 
    var o = [];
    for (var i=0; i < a.length; i++) {
		o[i] = a[i];
    } 
    for (var j, x, i = o.length;
	 i;
	 j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);	
    return o;
}
//global variables here
var trialOrder=shuffle(trialOrder)
var thisTrialIndex=trialOrder[curTrial] 

////


function startExp(){
	$('#Welcome').fadeOut('fast'); // hide intro screen
	$('#getAge').fadeIn('fast'); // fade in ready button
}

function endExp(){
	$('#mainExp').fadeOut('fast'); 
	$('#Thanks').fadeIn('fast'); // hide intro screen
}

// for the first time we start the experiment
function startDrawing(){
		// loadNextVideo(thisTrialIndex)
		document.getElementById("cue").innerHTML = "Can you draw a "  + stimListTest[thisTrialIndex].category;

	 $('#getAge').fadeOut('fast'); // fade out age screen
	 $('#mainExp').fadeIn('fast'); // fade in exp

        setTimeout(function() {showCue();},1000); 
        setTimeout(function() {hideCue();},5000);  // Take cues away after 5 - after video ends
        setTimeout(function() {showSubmit();},6000); // some minimum amount of time before "I'm done button"
		timestamp_cueOnset = new Date().getTime();
}


function showCue() {	
	$('#cue').fadeIn('fast'); //text cue associated with trial
	// $('#cueVideoDiv').show(); //show video div 
	// playVideo();
}

function hideCue() {
	$('#cue').fadeOut('fast'); // fade out cue
	// $('#cueVideoDiv').hide(); //show video html - this can be a variable later?
	$('#sketchpad').fadeIn('fast'); // fade in sketchpad  here?
}

function showSubmit() {
	$('#submit_div').fadeIn('fast');
}

// video player functions
// function playVideo(){
//   videojs("cueVideo").ready(function(){ // need to wait until video is ready
//   var player = this;
//   player.play();
// 	});
// }

// function loadNextVideo(){
//   var player=videojs('cueVideo');
//   player.pause();
//   var thisTrialIndex=trialOrder[curTrial] 
//   console.log(stimListTest[thisTrialIndex].video)
//   player.src({ type: "video/mp4", src: "videos/" + stimListTest[thisTrialIndex].video });
//   player.load();
// }


function nextTrial() {
	curTrial++
	console.log('clicked submit');
	project.activeLayer.removeChildren(); // clear sketchpad hack?
	$('#sketchpad').fadeOut('fast'); // fade out sketchpas before choice buttons
	if (curTrial<maxTrials){
		var thisTrialIndex=trialOrder[curTrial] 
		// loadNextVideo(thisTrialIndex);
		document.getElementById("cue").innerHTML = "Can you draw a "  + stimListTest[thisTrialIndex].category;

		$('#submit_div').fadeOut('fast'); // fade out submit button
		$('#ready').fadeIn('fast'); // fade in ready
		$('#goodJob').fadeIn('fast'); 
		$('#allDone').fadeIn('fast'); 
		// GET NEXT CUE AND VIDEO //
	}
	else {
		endExp();
	}

}

window.onload = function() { 

  $('#submit').click(function () {
    // save sketch png
    var dataURL = document.getElementById('sketchpad').toDataURL();
    dataURL = dataURL.replace('data:image/png;base64,','');
    var thisTrialIndex=trialOrder[curTrial] 
    var category = stimListTest[thisTrialIndex].category;
    var age = $('#years').value;

    readable_date = new Date();
    current_data = {
        dataType: 'finalImage',
        sessionId: sessionId,
        imgData: dataURL,
        category: category,
        dbname:'kiddraw',
        colname:'pilot0',
        trialNum: curTrial,
        time: Date.now(),
        date: readable_date,
        age: age}; 

    // console.log(current_data);

    // send data to server to write to database
    socket.emit('current_data', current_data);
    nextTrial();
  });

  // for other trials
  $('#ready').on('touchstart click',function(){
      console.log('touched ready button');
      $('#goodJob').fadeOut('fast'); 
      $('#ready').fadeOut('fast');
      $('#allDone').fadeOut('fast');
          setTimeout(function() {showCue();},1000); 
          setTimeout(function() {hideCue();},5000);  // Take cues away after 4s?
          setTimeout(function() {showSubmit();},6000); // some minimum amount of time before "I'm done button"
      timestamp_cueOnset = new Date().getTime();
  })


  $('#allDone').on('touchstart click',function(){
      console.log('touched all done');
      $('#ready').fadeOut('fast');
      $('#allDone').fadeOut('fast');
          endExp();
  })
   


  // Drawing related tools
  paper.setup('sketchpad');
  // Create a simple drawing tool:
  var tool = new Tool();
  tool.minDistance = 10;
  var path, path2;     

  // Define a mousedown and mousedrag handler
  tool.onMouseDown = function(event) {
    path = new Path();      
    path.strokeColor = '#000000';
    path.strokeWidth = 10;
    path.add(event.point);
  }

  tool.onMouseDrag = function(event) {
    path.add(event.point);
  }

  tool.onMouseUp = function(event) {
    path.selected = false;
    path.simplify(10);
    finalPoint = path._segments.slice(-1)[0];

    // var jsonString = path.exportJSON({asString: true});
    var svgString = path.exportSVG({asString: true});
    var thisTrialIndex=trialOrder[curTrial] 
    var category = stimListTest[thisTrialIndex].category;
    var readable_date = new Date();

    stroke_data = {
      dataType: 'stroke',
      sessionId: sessionId,
      svg: svgString,
      category: category,
      dbname:'kiddraw',
      colname:'pilot0',
      trialNum: curTrial,
      time: Date.now(),
      date: readable_date,    
      age: 'unknown'  
    };

    // console.log(stroke_data);
    // send stroke data to server
    socket.emit('stroke',stroke_data);
    
  }

}





