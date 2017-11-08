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
      {"category": "shoe"},
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
var clickedSubmit=0;
////


function startExp(){
	$('#Welcome').fadeOut('fast'); // hide intro screen
	$('#getAge').fadeIn('fast'); // fade in ready button
}

function endExp(){
	$('#mainExp').fadeOut('fast'); 
	$('#Thanks').fadeIn('fast'); // hide intro screen
}

function monitorProgress(){
  console.log('starting monitoring')
  $('#progressBar').show();
  progress(20, 20, $('#progressBar')); // show progress bar
}


// for the first time we start the experiment
function startDrawing(){
		// loadNextVideo(thisTrialIndex)
		document.getElementById("cue").innerHTML = "Can you draw a "  + stimListTest[thisTrialIndex].category;
    

	 $('#getAge').fadeOut('fast'); // fade out age screen
	 $('#mainExp').fadeIn('fast'); // fade in exp
    // // resize canvas
    var canvas = document.getElementById("sketchpad"),
         ctx=canvas.getContext("2d");
    canvas.style.height='600px';
    canvas.style.width='600px';
    // //
    setTimeout(function() {showCue();},1000); 
    setTimeout(function() {hideCue();},5000);  // Take cues away after 5 - after video ends
    setTimeout(function() {showSubmit();},6000); // some minimum amount of time before "I'm done button"
		timestamp_cueOnset = new Date().getTime();
}


function showCue() {	
	$('#cue').fadeIn('fast'); //text cue associated with trial
}

function hideCue() {
	// $('#cue').fadeOut('fast'); // fade out cue
	// $('#cueVideoDiv').hide(); //show video html - this can be a variable later?
	$('#sketchpad').fadeIn('fast'); // fade in sketchpad  here?
  clickedSubmit=0; // reset this global
  monitorProgress() 
}

function showSubmit() {
	$('#submit_div').fadeIn('fast');
}


function nextTrial() {
	curTrial++

	project.activeLayer.removeChildren(); // clear sketchpad hack?
	$('#sketchpad').fadeOut('fast'); // fade out sketchpas before choice buttons
	if (curTrial<maxTrials){
		var thisTrialIndex=trialOrder[curTrial] 
		document.getElementById("cue").innerHTML = "Can you draw a "  + stimListTest[thisTrialIndex].category;
    $('#cue').fadeOut('fast'); 
    $('#progressBar').fadeOut('fast'); // fade out submit button
		$('#submit_div').fadeOut('fast'); // fade out submit button
		$('#ready').fadeIn('fast'); // fade in ready
		$('#goodJob').fadeIn('fast'); 
		$('#allDone').fadeIn('fast'); 
	}
	else {
		endExp();
	}

}

function automaticEnd(){

        console.log(' automatically triggered next trial ')
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
            date: readable_date}; 

        // send data to server to write to database
        socket.emit('current_data', current_data);
        nextTrial();
  };


function progress(timeleft, timetotal, $element) {
    var progressBarWidth = timeleft * $element.width() / timetotal;
    var timeLeftOut = timeleft
    $element.find('div').animate({ width: progressBarWidth }, timeleft == timetotal ? 0 : 1000, "linear").html(Math.floor(timeleft/60) + ":"+ timeleft%60);
    console.log("clicked submit = " + clickedSubmit)
    console.log("time left = " + timeleft)
    if(timeleft > 0 & clickedSubmit==0) {
        setTimeout(function() {
            progress(timeleft - 1, timetotal, $element);
        }, 1000);
      }
    else if(timeleft == 0 & clickedSubmit==0){
      automaticEnd();
    }
  };

window.onload = function() { 

  $('#submit').click(function () {
    clickedSubmit=1;
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





