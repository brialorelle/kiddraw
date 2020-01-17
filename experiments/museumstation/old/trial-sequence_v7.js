/* 

Handles dynamic elements of museumdraw task
Started Oct 26 2017
Last updates July 2019
*/

// 0. Load dependenciese
paper.install(window);
socket = io.connect();

// 1. Setup trial order and randomize it!
firstTrial = {"category": "this square", "video": "copy_square.mp4", "image":"images/square.png"}
trace1 = {"category":"square", "video": "trace_square.mp4", "image":"images/square.png"}
trace2 = {"category":"shape", "video": "trace_shape.mp4","image":"images/shape.png"}
intro = {"category":"intro", "video": "intro.mp4","image":"images/lab_logo_stanford.png"}

var stimListTest = [{"category": "a bee", "video": "bee.mp4"},
    {"category": "a clock", "video": "clock.mp4"},
    {"category": "a face", "video": "face.mp4"},
    {"category": "a hand", "video": "hand.mp4"},
    {"category": "a mushroom", "video": "mushroom.mp4"},
    {"category": "an octopus", "video": "octopus.mp4"},
    {"category": "a piano", "video": "piano.mp4"},
    {"category": "a spider", "video": "spider.mp4"}]

var stimListTest = shuffle(stimListTest)
stimListTest.unshift(firstTrial)
stimListTest.unshift(trace2)
stimListTest.unshift(trace1)
stimListTest.unshift(intro)

var curTrial=0 // global variable, trial counter
var maxTrials = stimListTest.length; //


var stimLang = {
    "this square": "this square",
    "square": "square",
    "shape": "shape",
    "a bee": "a bee",
    "a clock": "a clock",
    "a face": "a face",
    "a hand": "a hand",
    "a mushroom": "a mushroom",
    "an octopus": "an octopus",
    "a piano": "a piano",
    "a spider": "a spider"}

var cuesLang = {
    "trace": "Can you trace the ",
    "copy": "Can you copy ",
    "draw": "Can you draw ",
    "endQuestion": " ?"
}
var checkBoxAlert = "Can we use your child's drawings? If so, please click the box above to start drawing!";
var ageAlert = "Please select your age group.";

// set global variables
var clickedSubmit=0; // whether an image is submitted or not
var tracing = true; //whether the user is in tracing trials or not
var maxTraceTrial = 2; //the max number of tracing trials
maxTraceTrial = maxTraceTrial + 1 // add one because the intro technically gets logged as a trial
var timeLimit=30;
var disableDrawing = false; //whether touch drawing is disabled or not
var language = "English";
var strokeThresh = 3; // each stroke needs to be at least this many pixels long to be sent

// current mode and session info
var mode = "CDM";
var version ="cdm_run_v7";
var sessionId= version + Date.now().toString();
var consentPage = '#consentCDM';
var thanksPage = "#thanksPage";

// shuffle the order of drawing trials
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
        $(consentPage).fadeOut('fast'); // fade out age screen
        showIntroVideo();  
    }
    else if (curTrial>0 && curTrial<maxTrials) {
        if (curTrial == maxTraceTrial){
            tracing = false
            $('#sketchpad').css('background-image','');
        }
        beginTrial()
    }
    else if (curTrial==maxTrials){
        endExperiment();
    }
}


function showIntroVideo(){
    var player = loadNextVideo(curTrial); // change video
    document.getElementById("cue").innerHTML = "This game is for only one person at a time. Please draw by yourself!";
    setTimeout(function() {showCue();},1000);
    setTimeout(function() {playVideo(player);},1000);
}


// for the start of each trial
function beginTrial(){
    //
    var player = loadNextVideo(curTrial); // change video
    if (tracing){
        var traceCue = cuesLang["trace"]  + stimLang[stimListTest[curTrial].category] + cuesLang["endQuestion"];
        document.getElementById("cue").innerHTML = traceCue;
        document.getElementById("drawingCue").innerHTML = traceCue;
    }else {
        if (stimListTest[curTrial].category == 'this square'){
            var circleCue = cuesLang["copy"]  + stimLang[stimListTest[curTrial].category] + cuesLang["endQuestion"];
            document.getElementById("cue").innerHTML = circleCue;
            document.getElementById("drawingCue").innerHTML = circleCue;
        }else{
            document.getElementById("cue").innerHTML = cuesLang["draw"] + stimLang[stimListTest[curTrial].category] + cuesLang["endQuestion"]; // change cue
            document.getElementById("drawingCue").innerHTML = stimLang[stimListTest[curTrial].category]; // change drawing cue
        }

    }
    setTimeout(function() {showCue();},1000);
    setTimeout(function() {playVideo(player);},1000);
}

// show cue without drawing canvas
function showCue() {
    $('#mainExp').fadeIn('fast'); // fade in exp
    $('#cue').fadeIn('fast'); // text cue associated with trial
}

// video player functions
function playVideo(player){
    $('#cueVideoDiv').fadeIn(); // show video div
    player.ready(function(){ // need to wait until video is ready
        this.play();
        this.on('ended',function(){
            console.log('video ends and drawing starts');
            $('#cueVideoDiv').fadeOut();
            setTimeout(function(){
                $('#cue').hide(); // fade out cue
                player.dispose(); //dispose the old video and related eventlistener. Add a new video
                if (curTrial==0) { // after intro
                    console.log('starting first trial')
                    curTrial = curTrial + 1
                    setTimeout(function() {beginTrial();},1000); /// start trial sequence after intro trial
                }
                else{ /// if not on introductory trial
                    setUpDrawing(); // set up the drawing canvas
                }
                $("#cueVideoDiv").html("<video id='cueVideo' class='video-js' playsinline> </video>");
            }, 500);

        });
    });
}

function loadNextVideo(){
    var player=videojs('cueVideo',{
        "controls": false,
        "preload":"auto"
    });
    player.pause();
    player.volume(1); // set volume to max 
    console.log(stimListTest[curTrial].video)
    player.src({ type: "video/mp4", src: "videos_smaller/" + stimListTest[curTrial].video });
    player.load();
    return player;
}

function setUpDrawing(){
    var imgSize = "70%";
    disableDrawing = false;
    $('#sketchpad').css({"background": "", "opacity":""});

    if (tracing){
        //for all tracing trials, show the tracing image on the canvas
        var imageurl = "url('" + stimListTest[curTrial].image + "')";
        $('#sketchpad').css("background-image", imageurl)
            .css("background-size",imgSize)
            .css("background-repeat", "no-repeat")
            .css("background-position","center center");
        $("#submit_div").show();
        $("#lastTrial").hide();

    }else if(stimListTest[curTrial].category == 'this square'){
        //for the circle trial, show the circle image for 1s and hide it.
        var imageurl = "url('" + stimListTest[curTrial].image + "')";
        $('#sketchpad').css("background-image", imageurl)
            .css("background-size",imgSize)
            .css("background-repeat", "no-repeat")
            .css("background-position","center center");

        setTimeout(function () {
            $('#sketchpad').css("background-image", "");
        }, 1000);

    }else if(curTrial == maxTrials-1){
        $("#submit_div").hide();
        $("#lastTrial").show();
    }

    $('#drawing').fadeIn()
    monitorProgress(); // start the timeout functino
};

function monitorProgress(){
    clickedSubmit=0;
    startTrialTime=Date.now()
    console.log('starting monitoring')
    progress(timeLimit, timeLimit, $('.progress')); // show progress bar
    $('.progress-bar').attr('aria-valuemax',timeLimit);
    $('.progress').show(); // don't show progress bar until we start monitorung
};

//  monitors the progress and changes the js elements associated with timeout bar
function progress(timeleft, timetotal, $element) {
    var progressBarWidth = timeleft * $element.width()/ timetotal;
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
        clickedSubmit = 1 // it's as if we clicked submit
        disableDrawing = true // can't draw after trial timed out
        if($("#lastTrial").css("display")!="none"){
            $('#endGame').addClass('bounce')
        }else {
            $('#keepGoing').addClass('bounce')
        }
        $("#sketchpad").css({"background":"linear-gradient(#17a2b81f, #17a2b81f)", "opacity":"0.5"});
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
    // saves data at the end of trial

    // downsamplesketchpad before saveing
    var canvas = document.getElementById("sketchpad"),
        ctx=canvas.getContext("2d");

    tmpCanvas = document.createElement("canvas");
    tmpCanvas.width=150;
    tmpCanvas.height=150;
    destCtx = tmpCanvas.getContext('2d');
    destCtx.drawImage(canvas, 0,0,150,150)

    var dataURL = tmpCanvas.toDataURL();
    dataURL = dataURL.replace('data:image/png;base64,','');

    // get critical trial variables
    var category = stimListTest[curTrial].category;
    var age = $('.active').attr('id');

    // test stirng
    readable_date = new Date();
    current_data = {
                dataType: 'finalImage',
                sessionId: sessionId, // each child
                imgData: dataURL,
                category: category, // drawing category
                dbname:'kiddraw',
                colname: version, 
                location: mode,
                trialNum: curTrial,
                endTrialTime: Date.now(), // when trial was complete, e.g., now
                startTrialTime: startTrialTime, // when trial started, global variable
                date: readable_date,
                age: age};

    // send data to server to write to database
    socket.emit('current_data', current_data);
};


function setLanguage(lang){
    //If the user choose other langauges
    var filename = "language/"+lang +".json";
    $.getJSON(filename, function( data ) {
        $.each( data, function( key, val ) {
            var id = "#" + key;
            $(id).text(val);
        });
        checkBoxAlert = data["checkBoxAlert"];
        ageAlert = data["ageAlert"];
    });
}

// experiment navigation functions
function showConsentPage(){
    $("#landingPage").hide();
    $('#parentEmail').val('');
    $('#email-form').show();
    $('#emailSent').hide();
    $(consentPage).fadeIn();
}

function restartExperiment() {
   
   var age = $('.active').attr('id'); // only active button from first page
   
   // send survey participation data
   var parent_drew = document.getElementById("survey_parent").checked
   var child_drew = document.getElementById("survey_child").checked
   var other_drew = document.getElementById("survey_else").checked

   current_data = {
   				parent_drew: parent_drew,
   				child_drew: child_drew,
   				other_drew: other_drew,
                dataType: 'survey',
                sessionId: sessionId, // each child
                dbname:'kiddraw',
                colname: version, 
                location: mode,
                date: readable_date,
                age: age};

    // send data to server to write to database
    socket.emit('current_data', current_data);
    console.log('sending survey data')
    
    window.location.href="https://stanford-cogsci.org:8881/landing_page.html" // load back to regular landing page
}

function endExperiment(){
    $(thanksPage).show();
    curTrial = -1;
    // wait for 1min and restart entire experiment
    setTimeout(function(){
        if(curTrial == -1) {
            console.log("restart after 60 seconds");
            restartExperiment()
        }
    }, 60000);
}

function increaseTrial(){
    saveSketchData() // save first!
    curTrial=curTrial+1; // increase trial counter
}


//////////////////////////////////////////////////////////////////////////////

window.onload = function() {
    $.get("/mode", function(data){
        mode = data.mode;
        if(mode=='Bing') {
            consentPage = '#consentBing';
            thanksPage = "#thanksBing";
            console.log(" mode Bing")
        }else if(mode=="CDM"){
            consentPage = '#consentCDM';
            thanksPage = "#thanksPage";
            console.log("mode CDM")
        }
    });

    /////////////// GENERAL BUTTON FUNCTIONS ///////////////
    document.ontouchmove = function(event){
        event.preventDefault();
    }

    $('#startConsent').bind('touchstart mousedown',function(e) {
        e.preventDefault();
        showConsentPage();
    });

    $('.langButton').bind('touchstart mousedown',function(e) {
        e.preventDefault()
        language = $(this).attr('id');
        setLanguage(language);
        $("#langChosen").text($(this).text());
        $("#langDrop").removeClass("show");
    });

    $('.startExp').bind('touchstart mousedown',function (e) {
        e.preventDefault()
        console.log('touched start button');

        if (mode == "Bing"){
            console.log("Bing");

            if ($("#firstName").val().trim().length==0 ) {
                alert("Please enter your first name.");
            }else if($("#lastName").val().trim().length==0){
                alert("Please enter your last name.");
            }else{
                startDrawing();
            }

        }else{
            console.log("CDM");
            if (!$("#checkConsent").is(':checked')) {
                alert(checkBoxAlert)
            }else if($(".active").val()==undefined){
                alert(ageAlert)
            }
            else {
                startDrawing();
            }
        }

    });

    // if child presses the "lets keep drawing" button....e.g.,  the SUBMIT button
    $('#keepGoing').bind('touchstart mousedown',function(e) {
        e.preventDefault()
        $('#keepGoing').removeClass('bounce')

        console.log('touched next trial button');
        if(clickedSubmit==0){// if the current trial has not timed out yet
            clickedSubmit=1; // indicate that we submitted - global variable
            increaseTrial(); // save data and increase trial counter
        }

        $('#drawing').hide(); // hide the canvas
        project.activeLayer.removeChildren(); // clear the canvas
        startDrawing(); // start the new trial
    });

    $('.allDone').bind('touchstart mousedown',function(e) {
        e.preventDefault()
        // if (isDoubleClicked($(this))) return;

        console.log('touched endExperiment  button');
        if(clickedSubmit==0){// if the current trial has not timed out yet
            clickedSubmit=1; // indicate that we submitted - global variable
            increaseTrial(); // save data and increase trial counter
        }
        $('#mainExp').hide();
        $('#drawing').hide();
        $('#keepGoing').removeClass('bounce')
        endExperiment();

    });

    // last "end" button after child has completed all trials
    $('.endRestart').bind('touchstart mousedown',function(e){
        e.preventDefault()
        console.log('restart to the landing page')
        restartExperiment()
    });


    // email sending function
    $('#sendEmail').bind('touchstart mousedown',function(e){
        e.preventDefault()
        var email = $('#parentEmail').val()
        $.get("/send", {email:email}, function(data){
            if(data=="sent"){
                $('#email-form').hide()
                $('#emailSent').show()
            }else{
                alert('invalid email')
            }
        });
    });

    // for toggling between age b uttons
    $('.ageButton').bind('touchstart mousedown',function(e){
        e.preventDefault()
        $('.ageButton').removeClass('active')
        $(this).addClass('active')
    });

    /////////////// DRAWING PARAMETERS AND FUNCTIONS ///////////////
    var canvas = document.getElementById("sketchpad"),
        ctx=canvas.getContext("2d");
    canvas.height = window.innerWidth*.80; // set to 80% of the actual screen
    canvas.width = canvas.height;


    // Initialize paper.js
    paper.setup('sketchpad');

    // Each time we send a stroke...
    function sendStrokeData(path) {
        path.selected = false

        var svgString = path.exportSVG({asString: true});
        var category = stimListTest[curTrial].category;
        var readable_date = new Date();
        var age = $('.active').attr('id');
        
        console.log('time since we started the trial')
        console.log(endStrokeTime - startTrialTime)
        console.log("time of this stroke")
        console.log(endStrokeTime - startStrokeTime)

        stroke_data = {
            dataType: 'stroke',
            sessionId: sessionId,
            svg: svgString,
            category: category,
            dbname:'kiddraw',
            colname: version,
            location: mode,
            trialNum: curTrial,
            startTrialTime: startTrialTime,
            startStrokeTime: startStrokeTime,
            endStrokeTime: endStrokeTime,
            date: readable_date,
            age: age};

        // send stroke data to server
        console.log(stroke_data)
        socket.emit('stroke',stroke_data);
        
    }

    ///////////// TOUCH EVENT LISTENERS DEFINED HERE ///////////////

    function touchStart(ev) {
        if(disableDrawing){
            return;
        }

        startStrokeTime = Date.now()
        console.log("touch start");
        touches = ev.touches;
        if (touches.length>1){
            return; // don't do anything when simultaneous -- get out of this function
            console.log("detedcted multiple touches")
        }
        
        // Create new path 
        path = new Path();
        path.strokeColor = 'black';
        path.strokeCap = 'round'
        path.strokeWidth = 10;
        
        // add point to path
        var point = view.getEventPoint(ev); // should only ever be one
        path.add(point);
        view.draw();
    }

    function touchMove(ev) {
        if(disableDrawing){
            return;
        }
        //console.log("touch move");

        // don't do anything when simultaneous touches
        var touches = ev.touches;
        if (touches.length>1){
            return; 
        }
        // add point to path
        var point = view.getEventPoint(ev); 
        path.add(point);
        view.draw();
    }

    function touchEnd(ev){
        if(disableDrawing){
            return;
        }
	// get stroke end time
        endStrokeTime = Date.now();
        console.log("touch end");  

        // simplify path
        //console.log("raw path: ", path.exportSVG({asString: true}));        
        path.simplify(3);
        path.flatten(1);
        //console.log("simpler path: ", path.exportSVG({asString: true}));

        // only send data if above some minimum stroke length threshold      
        //console.log('path length = ',path.length);
        var currStrokeLength = path.length;
        if (currStrokeLength > strokeThresh) {
            sendStrokeData(path);
           }

    }

    targetSketch = document.getElementById("sketchpad");
    targetSketch.addEventListener('touchstart', touchStart, false);
    targetSketch.addEventListener('touchmove', touchMove, false);
    targetSketch.addEventListener('touchend', touchEnd, false);

    // Refresh if no user activities in 60 seconds
    var time = new Date().getTime();
    $(document.body).bind("touchstart touchmove touchend click", function(e) {
        time = new Date().getTime();
    });

    var refreshTime = 120000
    function refresh() {
        if (new Date().getTime() - time >= refreshTime) {
                window.location.href="https://stanford-cogsci.org:8881/landing_page.html"
                console.log("No user activities. Reload.")
        } else {
            setTimeout(refresh, refreshTime);
        }

    }

    setTimeout(refresh, refreshTime);



} // on document load





