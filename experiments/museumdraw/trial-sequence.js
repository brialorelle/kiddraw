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

stimListTest=shuffle(stimListTest)
stimListTest.unshift({category:"circle"})
stimListTest.unshift({category:"triangle"})
var maxTrials = stimListTest.length; // 18 should be max including familiarization
var curTrial=0 // global variable, trial counter
var sessionId='E1c_' + Date.now().toString()
var timeLimit=30; // in seconds

//global variables here
var clickedSubmit=0;

//// simple show/hide functions
function startExp(){
	$('#Welcome').fadeOut('fast'); // hide intro screen
	$('#getAge').fadeIn('fast'); // fade in ready button
}

function endExp(){
	$('#mainExp').fadeOut('fast'); 
	$('#Thanks').fadeIn('fast'); // hide intro screen
}

function showCue() {	
	$('#cue').fadeIn('fast'); //text cue associated with trial
}

function hideCue() {
  $('#sketchpad').fadeIn('fast'); // fade in sketchpad  here?
  $('#submit_div').fadeIn('fast');
  monitorProgress() 
}

function monitorProgress(){
  clickedSubmit=0;
  console.log('starting monitoring')
  progress(timeLimit, timeLimit, $('#progressBar')); // show progress bar
  $('#progressBar').show(); // don't show progress bar until we start monitorung
}

// every time we start drawing
function startDrawing(){
	resizeCanvas()
	document.getElementById("cue").innerHTML = "Can you draw a "  + stimListTest[curTrial].category;   
	 $('#mainExp').fadeIn('fast'); // fade in exp
    // 
    setTimeout(function() {showCue();},1000); 
    setTimeout(function() {hideCue();},3000);  // Take cues away after 5 - after video ends
	timestamp_cueOnset = new Date().getTime();
}


//  when we're done with a trial and go to the next screen
function nextTrial() {
	console.log("got to next trial function")
	project.activeLayer.removeChildren(); // clear sketchpad hack?
	$('#cue').fadeOut('fast');  // get rid of cue
    $('#progressBar').fadeOut('fast'); // fade out progress bar
    $('#submit_div').fadeOut('fast'); // fade out submit button
	$('#sketchpad').fadeOut('fast'); // fade out sketchpas before choice buttons
 	 //
  	curTrial++ // increase trial counter
  	console.log(curTrial)
	if (curTrial<maxTrials){
    // fade in ready next screen and set up trial
		$('#ready').fadeIn('fast'); // let's keep going button 
		$('#goodJob').fadeIn('fast'); // good job image
		$('#allDone').fadeIn('fast'); // all done with drawing button
	}
	else {
		endExp();
	}
}

//  monitoring progress spent on a trial and triggering next events
function progress(timeleft, timetotal, $element) {
    var progressBarWidth = timeleft * $element.width() / timetotal;
    var totalBarWidth = timetotal * $element.width();
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
        console.log("trial timed out")
        saveSketchData();
        nextTrial();
        $element.find('div').width(totalBarWidth)
        return; //  get out of here
      }
    else if (clickedSubmit==1){   
      console.log("exiting out of progress function")
      $element.find('div').width(totalBarWidth)
      return; //  get out of here, data being saved by other button
    }
  };


// saving sketch data to server
function saveSketchData(){
	// downsamplesketchpad before saveing
	var canvas = document.getElementById("sketchpad"),
         ctx=canvas.getContext("2d");
	ctx = canvas.getContext('2d');
	ctx.width=200;
	ctx.height=200;
	canvas.style.height='200px';
  canvas.style.width='200px';
	//
  var dataURL = canvas.toDataURL();
  console.log(dataURL.length)
  dataURL = dataURL.replace('data:image/png;base64,','');
  var category = stimListTest[curTrial].category;
  var age = document.getElementById('years').value;

  // test stirng
    readable_date = new Date();
    current_data = {
        dataType: 'finalImage',
        sessionId: sessionId,
        imgData: dataURL,
        category: category,
        dbname:'kiddraw',
        colname:'E1c',
        trialNum: curTrial,
        time: Date.now(),
        date: readable_date,
        age: age}; 

    // send data to server to write to database
    socket.emit('current_data', current_data);
}

// resizing the canvas at the start of each trial
function resizeCanvas(){
    // resize canvas
    var canvas = document.getElementById("sketchpad"),
         ctx=canvas.getContext("2d");
    canvas.style.height='600px';
    canvas.style.width='600px';
  ctx.width=600;
	ctx.height=600;
}


window.onload = function() { 

   resizeCanvas(); // make sure the canvas is the right size

  $('#submit').click(function(){
  	 clickedSubmit=1;
	 console.log('touched submit button');
	 saveSketchData();
     nextTrial();
	});
 
  // for other trials, coming from intermediate screen
  $('#ready').click(function() {
    $('#ready').fadeOut('fast'); // let's keep going button 
	  $('#goodJob').fadeOut('fast'); // good job image
	  $('#allDone').fadeOut('fast'); // all done with drawing button
      console.log('touched ready button');
      startDrawing();
  });

  // coming from age screen at beginning
  $('#startTask').click(function(){
      $('#getAge').fadeOut('fast'); // fade out age screen
      startDrawing();
  });

  // just want to wrap up
  $('#allDone').click(function(){
      console.log('touched all done');
      $('#ready').fadeOut('fast');
      $('#allDone').fadeOut('fast');
          endExp();
  });
   

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
    // path.simplify(5); /// this was messing kids up
    finalPoint = path._segments.slice(-1)[0];

    // var jsonString = path.exportJSON({asString: true});
    var svgString = path.exportSVG({asString: true});
    var category = stimListTest[curTrial].category;
    var readable_date = new Date();
    var age = document.getElementById('years').value;

    stroke_data = {
      dataType: 'stroke',
      sessionId: sessionId,
      svg: svgString,
      category: category,
      dbname:'kiddraw',
      colname:'E1c',
      trialNum: curTrial,
      time: Date.now(),
      date: readable_date,    
      age: age};

    // console.log(stroke_data);
    // send stroke data to server
    socket.emit('stroke',stroke_data);
    
  }

}





