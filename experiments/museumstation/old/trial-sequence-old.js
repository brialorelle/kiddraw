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
var stimListTest = [{"category": "rabbit", "video": "rabbit.mp4"},
    {"category": "boat", "video": "boat.mp4"},
    {"category": "cup", "video": "cup.mp4"},
    {"category": "banana", "video": "banana.mp4"}]

var stimListTest = shuffle(stimListTest)
var curTrial=0 // global variable, trial counter
var sessionId='stationPilot0_' + Date.now().toString()
var maxTrials = stimListTest.length-1; // 

// set global variables
var clickedSubmit=0;
var timeLimit=30;
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


// for each time we start drawings
function startDrawing(){
    if (curTrial==0){
        saveConsentData();
        $('#consentPage').fadeOut('fast'); // fade out age screen
        beginTrial()
    }
    else if (curTrial>0 && curTrial<maxTrials) {
        $('#readyOrNotPage').fadeOut('fast'); // fade out age screen
        beginTrial()
    }
    else if (curTrial==maxTrials){
        endExperiment();
    }
}

function beginTrial(){
    //
    clickedSubmit=0; //reset this variable
    loadNextVideo(curTrial) // change video
    document.getElementById("cue").innerHTML = "Can you draw a "  + stimListTest[curTrial].category + " ?"; // change cue
    //
    setTimeout(function() {showCue();},1000);
    setTimeout(function() {hideCue();},5000);  // Take cues away after 5 - after video ends
    setTimeout(function() {showSubmit();},6000); // some minimum amount of time before "I'm done button"
    timestamp_cueOnset = new Date().getTime();
}

// show cue without canvas
function showCue() {
    $('#mainExp').fadeIn('fast'); // fade in exp
    $('#cue').fadeIn('fast'); //text cue associated with trial
    $('#cueVideoDiv').show(); //show video div
    playVideo();
}

// hide cue and show sketchpad canvas
function hideCue() {
    $('#cue').fadeOut('fast'); // fade out cue
    $('#cueVideoDiv').hide(); //show video html - this can be a variable later?
    setUpDrawing()
}

function setUpDrawing(){
    $('#sketchpad').fadeIn('fast');
    monitorProgress(); // since we now have a timeout function 
};


function monitorProgress(){
    clickedSubmit=0;
    console.log('starting monitoring')
    progress(timeLimit, timeLimit, $('.progress')); // show progress bar
    $('.progress-bar').attr('aria-valuemax',timeLimit);
    $('.progress').show(); // don't show progress bar until we start monitorung
};

//  monitoring progress spent on a trial and triggering next events
function progress(timeleft, timetotal, $element) {
    console.log("called progress function")
    var progressBarWidth = timeleft * $element.width()/ timetotal;
    var totalBarWidth = timetotal * $element.width();
    $element.find('.progress-bar').attr("aria-valuenow", timeleft).text(timeleft)
    $element.find('.progress-bar').animate({ width: progressBarWidth }, timeleft == timetotal ? 0 : 1000, "linear");
    console.log("clicked submit = " + clickedSubmit)
    console.log("time left = " + timeleft)
    if(timeleft > 0 & clickedSubmit==0) {
        setTimeout(function() {
            progress(timeleft - 1, timetotal, $element);
        }, 1000);
    }
    else if(timeleft == 0 & clickedSubmit==0){
        console.log("trial timed out")
		increaseTrial();
        $element.find('div').width(totalBarWidth)
        return; //  get out of here
    }
    else if (clickedSubmit==1){
        console.log("exiting out of progress function")
        $element.find('div').width(totalBarWidth)
        return; //  get out of here, data being saved by other button
    }
};


function showSubmit() {
    $('#submit_div').fadeIn('fast');
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

// saving data functions
function saveSketchData(){
    // downsamplesketchpad before saveing
    var canvas = document.getElementById("sketchpad"),
        ctx=canvas.getContext("2d");

    tmpCanvas = document.createElement("canvas");
    tmpCanvas.width=150;
    tmpCanvas.height=150;
    destCtx = tmpCanvas.getContext('2d');
    destCtx.drawImage(canvas, 0,0,150,150)

    var dataURL = tmpCanvas.toDataURL();
    //var dataURL = canvas.toDataURL();
    // console.log(dataURLTest.length)
    // console.log("should be longer" +dataURL.length)


    dataURL = dataURL.replace('data:image/png;base64,','');
    var category = stimListTest[curTrial].category;

    // test stirng
    readable_date = new Date();
    current_data = {
        dataType: 'finalImage',
        sessionId: sessionId,
        imgData: dataURL,
        category: category,
        dbname:'kiddraw',
        colname:'stationPilot0',
        trialNum: curTrial,
        time: Date.now(),
        date: readable_date};

    // send data to server to write to database
    socket.emit('current_data', current_data);
};

function saveConsentData(){
    console.log(' saving consent "form" to database')
    // save sketch png
    // get age and consent placeholder
}

// experiment navigation functions
function showConsentPage(){
    $('#landingPage').fadeOut('fast');
    $('#consentPage').fadeIn('fast');
}

function restartExperiment() {
    project.activeLayer.removeChildren();
    $('.progress').hide();
    $('#mainExp').fadeOut('fast');
    $('#consentPage').fadeIn('fast'); // fade in consent screen
    $('#checkConsent').prop('checked', false); // uncheck consent box
    $('#submit_div').fadeOut('fast'); // fade out sketchpad etc
    $('#sketchpad').fadeOut('fast');
}

function readyOrNot(){
    project.activeLayer.removeChildren();
    $('#readyOrNotPage').fadeIn('fast');
    $('#mainExp').fadeOut('fast');
    $('.progress').hide();
    $('#submit_div').fadeOut('fast'); // fade out sketchpad etc
    $('#sketchpad').fadeOut('fast');
}

function endExperiment(){
    $('#readyOrNotPage').fadeOut('fast');
    $('#thanksPage').fadeIn('fast');
}

function increaseTrial(){
    curTrial=curTrial+1; // increase counter
    saveSketchData()
    readyOrNot();
}

window.onload = function() {

    $('#startConsent').click(function(e) {
        event.preventDefault(e)
        showConsentPage();
    });

    $('#startExp').click(function(e) {
        event.preventDefault(e)
        console.log('touched start button');
        if ($("#checkConsent").is(':checked')){
            startDrawing();
        }
        else {
            alert("Can we use your child's drawings? If so, please click the box above to start drawing!")
        }
    });

    // gets called whenever you click/touch the submit button
    $('#submit').click(function (e) {
        console.log("clicked submit")
        event.preventDefault(e)
        clickedSubmit=1; // indicate that we submitted - global variable
		increaseTrial(); // save data and increase trial counter
    });

    $('#keepGoing').click(function(e) {
        event.preventDefault(e)
        console.log('touched next trial button');
        startDrawing();
    });

    $('#allDone').click(function(e) {
        event.preventDefault(e)
        console.log('touched endExperiment  button');
        endExperiment()
    });

    $('#sendEmail').click(function(e){
        event.preventDefault(e)
        var email = $('#parentEmail').val()
        $.get("/send", {email:email}, function(data){
            if(data=="sent"){
                $('#email-form').hide()
                $('#emailSent').show()
            }
        });
    });

    $('.ageButton').click(function(e){
        event.preventDefault(e)
        $('.ageButton').removeClass('active')
        $(this).addClass('active')
    });

    //
    var canvas = document.getElementById("sketchpad"),
        ctx=canvas.getContext("2d");
    canvas.height = window.innerWidth*.80;
    canvas.width = canvas.height;

    // Drawing related tools
    paper.setup('sketchpad');

    // Create a simple drawing tool:
    // var tool = new Tool();
    // tool.minDistance = 10;
    var path;

    function touchStart(event) {
        path.strokeColor = '#000000';
        path.strokeCap = 'round';
        path.strokeWidth = 10;
        path.add(event.point);
        view.draw();
    }

    function touchMove(event) {
        console.log("touch moved")
        // event.preventDefault();
        path.add(event.point);
        view.draw();
    }

    function touchEnd(event){
        path.simplify(10);
        view.draw();
        saveStrokes()
        console.log("touch ended");
    }

    function saveStrokes(){
        var svgString = path.exportSVG({asString: true});
        var category = stimListTest[curTrial].category;
        var readable_date = new Date();

        stroke_data = {
            dataType: 'stroke',
            sessionId: sessionId,
            svg: svgString,
            category: category,
            dbname:'kiddraw',
            colname:'stationPilot0',
            trialNum: curTrial,
            time: Date.now(),
            date: readable_date
        };

        // send stroke data to server
        socket.emit('stroke',stroke_data); // not for demo
    }

    // only listen within sketchpad
    $('#sketchpad').on('touchstart click', function(e){
        console.log("called touchstart")
        e.stopPropagation(); e.preventDefault();
        touchStart(e)
        }
    );

    $('#sketchpad').on('touchmove click', function(e){
        e.stopPropagation(); e.preventDefault();
        touchMove(e)
        }
    );

   $('#sketchpad').on('touchend click', function(e){
        e.stopPropagation(); e.preventDefault();
        touchEnd(e)
        }
    );

    
}





