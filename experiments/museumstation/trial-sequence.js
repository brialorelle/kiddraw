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
firstTrial = {"category": "circle", "video": "circle.mp4"}
lastTrial = {"category": "love", "video": "love.mp4"}
var stimListTest = [{"category": "dog", "video": "dog.mp4"},
    {"category": "boat", "video": "boat.mp4"},
    {"category": "key", "video": "key.mp4"},
    {"category": "tiger", "video": "tiger.mp4"}]

var stimListTest = shuffle(stimListTest)
stimListTest.push(lastTrial)
stimListTest.unshift(firstTrial)
var curTrial=0 // global variable, trial counter
var sessionId='stationPilot0_' + Date.now().toString()
var maxTrials = stimListTest.length; // 

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
        $('#consentPage').fadeOut('fast'); // fade out age screen
        beginTrial()
    }
    else if (curTrial>0 && curTrial<maxTrials) {
        $('#readyOrNotPage').hide(); // fade out age screen
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
    document.getElementById("drawingCue").innerHTML = stimListTest[curTrial].category; // change drawing cue

    setTimeout(function() {showCue();},1000);
    var video = $('video');
    timestamp_cueOnset = new Date().getTime();
}

// video player functions
function playVideo(){
    videojs("cueVideo").ready(function(){ // need to wait until video is ready
        var player = this;
        player.play();
        this.on('ended',function(){
            console.log('video ends and drawing starts');
            hideCue();
            //dispose the old video and related eventlistener. Add a new video
            this.dispose();
            $("#cueVideoDiv").html("<video id='cueVideo' class='video-js' preload='auto' playsinline> <source src='videos/rabbit.mp4' type='video/mp4'> </video>");
        });
    });
}

function loadNextVideo(){
    var player=videojs('cueVideo');
    player.pause();
    console.log(stimListTest[curTrial].video)
    player.src({ type: "video/mp4", src: "videos/" + stimListTest[curTrial].video });
    player.load();
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
    $('#cue').hide(); // fade out cue
    $('#cueVideoDiv').hide(); //show video html - this can be a variable later?
    setUpDrawing()
}

function setUpDrawing(){
    $('#drawing').show()
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
    var progressBarWidth = timeleft * $element.width()/ timetotal;
    //var totalBarWidth = timetotal * $element.width();
    var totalBarWidth = $element.width();
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
        $element.find('.progress-bar').width(totalBarWidth)
        return; //  get out of here
    }
    else if (clickedSubmit==1){
        console.log("exiting out of progress function")
        $element.find('.progress-bar').width(totalBarWidth)
        return; //  get out of here, data being saved by other button
    }
};

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
    var age = $('.active').attr('id');

    // test stirng
    readable_date = new Date();
    current_data = {
        dataType: 'finalImage',
        sessionId: sessionId, // each child
        imgData: dataURL,
        category: category,
        dbname:'kiddraw',
        colname:'stationPilot0', // station version
        trialNum: curTrial,
        time: Date.now(),
        date: readable_date,
        age: age}; // age

    // send data to server to write to database
    socket.emit('current_data', current_data);
};


// experiment navigation functions
function showConsentPage(){
    $('#landingPage').hide();
    $('#consentPage').show();
    $('#parent-email').attr('placeholder', 'Input your email address here').val('');
    $('#email-form').show();
    $('#email-sent').hide();

}

function restartExperiment() {
    project.activeLayer.removeChildren();
    curTrial=0;
    clickedSubmit=0;
    sessionId='stationPilot0_' + Date.now().toString()
    $('.ageButton').removeClass('active');
    $('#thanksPage').hide();
    $('#landingPage').show(); // fade in the landing page
    $('#checkConsent').prop('checked', false); // uncheck consent box
}

function readyOrNot(){
    project.activeLayer.removeChildren();
    $('#readyOrNotPage').show();
    $('#mainExp').hide();
    $('#drawing').hide();
}

function endExperiment(){
    $('#thanksPage').show();
    curTrial = -1;
        //wait for 15 second and restart
        setTimeout(function(){
            if(curTrial == -1) {
                console.log("restart after 15 second");
                restartExperiment()
            }
        }, 15000);
}

function increaseTrial(){
    saveSketchData() // save first!
    curTrial=curTrial+1; // increase counter
    
    if (curTrial==maxTrials){
        project.activeLayer.removeChildren();
        $('#mainExp').hide();
        $('#drawing').hide();
        endExperiment();
    }else {
        readyOrNot();
    }
}

window.onload = function() {

    document.ontouchmove = function(event){
        event.preventDefault();
    }

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
        $('#readyOrNotPage').hide();
        endExperiment();

    });

    $('#endRestart').click(function(e){
        event.preventDefault(e)
        console.log('restart to the landing page')
        restartExperiment()
    });

    $('#sendEmail').click(function(e){
        event.preventDefault(e)
        var email = $('#parent-email').val()
        $.get("/send", {email:email}, function(data){
            if(data=="sent"){
                $('#email-form').hide()
                $('#email-sent').show()
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

    function sendStrokeData() {
        for(var i = 0; i < paths.length; i++){
            var path = paths[i];
            path.selected = false
  
        var svgString = path.exportSVG({asString: true});
        var category = stimListTest[curTrial].category;
        var readable_date = new Date();
        var age = $('.active').attr('id');

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
        console.log(stroke_data)
        socket.emit('stroke',stroke_data);         
        }
    }

        var paths = [];
        function touchStart(ev) {
            console.log("touch start");
            var touches = ev.touches;
            // Create new path per touch
            var path = new Path();
            path.strokeColor = 'black';
            path.strokeCap = 'round'
            path.strokeWidth = 10;
            paths.push(path);
        }

        function touchMove(ev) {
            console.log("touch move");
            var touches = ev.touches;
            // Prevents touch bubbling
            if(touches.length === paths.length) {
                for(var i = 0; i < touches.length; i++){
                    var path = paths[i];
                    var point = view.getEventPoint(touches[i]);
                    path.add(point);
                    view.draw();
                }
            }
        }

        function touchEnd(ev){
            console.log("touch end");
            sendStrokeData()
            var touches = ev.touches; // if not touching anymore
            // Empty paths array to start process over
            if(touches.length === 0){
                paths = [];
            }
            
        }

        targetSketch = document.getElementById("sketchpad");
        targetSketch.addEventListener('touchstart', touchStart, false);
        targetSketch.addEventListener('touchmove', touchMove, false);
        targetSketch.addEventListener('touchend', touchEnd, false);

} // on document load





