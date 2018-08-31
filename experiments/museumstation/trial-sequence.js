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
firstTrial = {"category": "this circle", "video": "circle.mp4", "image":"images/circle.png"}
lastTrial = {"category": "something you love", "video": "love.mp4"}
trace1 = {"category":"square", "video": "square.mp4", "image":"images/square.png"}
trace2 = {"category":"shape", "video": "shape.mp4","image":"images/shape.png"}

// round 1 -- finished June 1, 2018
var stimListTest = [{"category": "a boat", "video": "boat.mp4"},
    {"category": "a car", "video": "car.mp4"},
    {"category": "a cup", "video": "cup.mp4"},
    {"category": "a dog", "video": "dog.mp4"},
    {"category": "a fish", "video": "fish.mp4"},
    {"category": "a house", "video": "house.mp4"},
    {"category": "a tree", "video": "tree.mp4"},
    {"category": "a person", "video": "person.mp4"} ]

var stimListTest = shuffle(stimListTest)
stimListTest.push(lastTrial)
stimListTest.unshift(firstTrial)
stimListTest.unshift(trace2)
stimListTest.unshift(trace1)
var curTrial=0 // global variable, trial counter
var maxTrials = stimListTest.length; //
var stimLang = {
    "this circle": "this circle",
    "square": "square",
    "shape": "shape",
    "a car": "a car",
    "a fish": "a fish",
    "a boat": "a boat",
    "a house": "a house",
    "a dog": "a dog",
    "a cup": "a cup",
    "a tree": "a tree",
    "a person": "a person",
    "something you love": "something you love"}

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
var timeLimit=30;
var disableDrawing = false; //whether touch drawing is disabled or not
var language = "English";
var strokeThresh = 3; // each stroke needs to be at least this many pixels long to be sent

// current mode and session info
var mode = "CDM";
var version ="testing";
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
	beginTrial();
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

// for the start of each trial
function beginTrial(){
    //
    var player = loadNextVideo(curTrial); // change video
    if (tracing){
        var traceCue = cuesLang["trace"]  + stimLang[stimListTest[curTrial].category] + cuesLang["endQuestion"];
        document.getElementById("cue").innerHTML = traceCue;
        document.getElementById("drawingCue").innerHTML = traceCue;
    }else {
        if (stimListTest[curTrial].category == 'this circle'){
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
                setUpDrawing(); // set up the drawing canvas
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

    }else if(stimListTest[curTrial].category == 'this circle'){
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
    window.location.reload(true);
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
                colname: version,
                location: mode,
                trialNum: curTrial,
                startStrokeTime: startStrokeTime,
                endStrokeTime: Date.now(),
                date: readable_date,
                age: age};

            // send stroke data to server
            console.log(stroke_data)
            socket.emit('stroke',stroke_data);
        }
    }

    ///////////// TOUCH EVENT LISTENERS DEFINED HERE ///////////////

    var paths = []; // global paths variable
    function touchStart(ev) {
        if(disableDrawing){
            return;
        }

        startStrokeTime = Date.now()
        console.log("touch start");
        var touches = ev.touches;
        // Create new path per touch
        var path = new Path();
        path.strokeColor = 'black';
        path.strokeCap = 'round'
        path.strokeWidth = 10;
        paths.push(path);

        // Prevents touch bubbling
        for(var i = 0; i < touches.length; i++){
            var path = paths[i];
            var point = view.getEventPoint(touches[i]);
            path.add(point);
            view.draw();
        }

    }

    function touchMove(ev) {
        if(disableDrawing){
            return;
        }

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
        if(disableDrawing){
            return;
        }
        console.log("touch end");        
        var paths_copy = paths.clone();
        paths_copy.flatten(1);

        console.log('raw path: ', paths[0].exportSVG({asString: true}));
        console.log('simplified path: ', paths_copy[0].exportSVG({asString: true}));

        var currStrokeLength = paths[0].length;
        if (currStrokeLength > strokeThresh) {sendStrokeData();}
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

    // Refresh if no user activities in 60 seconds
    var time = new Date().getTime();
    $(document.body).bind("touchstart touchmove touchend click", function(e) {
        time = new Date().getTime();
    });

    var refreshTime = 90000
    function refresh() {
        if (new Date().getTime() - time >= refreshTime) {
            if($("#landingPage").css("display")=="none") {
                window.location.reload(true);
                console.log("No user activities. Reload.")
            }else{
                //if the current page is the landingPage, reset time and wait again
                time = new Date().getTime();
                setTimeout(refresh, refreshTime);
            }
        } else {
            setTimeout(refresh, refreshTime);
        }

    }

    setTimeout(refresh, refreshTime);




} // on document load





