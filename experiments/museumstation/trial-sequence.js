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
firstTrial = {"category": "a circle", "video": "circle_smaller.mp4", "image":"images/circle.png"}
lastTrial = {"category": "something you love", "video": "love_smaller.mp4"}
trace1 = {"category":"square", "video": "boat_smaller.mp4", "image":"images/square.png"}
trace2 = {"category":"shape", "video": "boat_smaller.mp4","image":"images/shape.png"}
var stimListTest = [{"category": "a dog", "video": "dog_smaller.mp4"},
    {"category": "a boat", "video": "boat_smaller.mp4"},
    {"category": "a key", "video": "key_smaller.mp4"},
    {"category": "a tiger", "video": "tiger_smaller.mp4"}]

var stimListTest = shuffle(stimListTest)
stimListTest.push(lastTrial)
stimListTest.unshift(firstTrial)
stimListTest.unshift(trace2)
stimListTest.unshift(trace1)
var curTrial=0 // global variable, trial counter
var sessionId='cdm_run_v1' + Date.now().toString()
var maxTrials = stimListTest.length; //


// set global variables
var clickedSubmit=0; // whether an image is submitted or not
var tracing = true; //whether the user is in tracing trials or not
var maxTraceTrial = 2; //the max number of tracing trials
var timeLimit=30;
var disableDrawing = false; //whether touch drawing is disabled or not
var mode = "CDM";// CDM or Bing
var version ="cdm_run_v1"

if(mode=='Bing') {
    var consentPage = '#consentBing';
    var thanksPage = "#thanksBing";
}else{
    var consentPage = '#consentCDM';
    var thanksPage = "#thanksPage";
}

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
        beginTrial()
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

//
function beginTrial(){
    //
    var player = loadNextVideo(curTrial); // change video
    if (tracing){
        var traceCue = "Can you trace the "  + stimListTest[curTrial].category + " on the canvas ?";
        document.getElementById("cue").innerHTML = traceCue;
        document.getElementById("drawingCue").innerHTML = traceCue;
    }else {
        document.getElementById("cue").innerHTML = "Can you draw " + stimListTest[curTrial].category + " ?"; // change cue
        document.getElementById("drawingCue").innerHTML = stimListTest[curTrial].category; // change drawing cue
    }

    setTimeout(function() {showCue();},1000);
    setTimeout(function() {playVideo(player);},1000);
}

// show cue without canvas
function showCue() {
    $('#mainExp').fadeIn('fast'); // fade in exp
    $('#cue').fadeIn('fast'); // text cue associated with trial
}

// video player functions
function playVideo(player){
    $('#cueVideoDiv').show(); // show video div
    player.ready(function(){ // need to wait until video is ready
        this.play();
        this.on('ended',function(){
            console.log('video ends and drawing starts');
            hideCue();
            this.dispose(); //dispose the old video and related eventlistener. Add a new video
            $("#cueVideoDiv").html("<video id='cueVideo' class='video-js' playsinline> </video>");
            //preload='auto'
        });
    });
}

// hide cue and show sketchpad canvas
function hideCue() {
    $('#cue').hide(); // fade out cue
    $('#cueVideoDiv').hide(); //show video html - this can be a variable later?
    setUpDrawing();
}

function loadNextVideo(){
    var player=videojs('cueVideo',{
      controls: false
    });
    player.pause();
    console.log(stimListTest[curTrial].video)
    player.src({ type: "video/mp4", src: "videos/" + stimListTest[curTrial].video });
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

    }else if(stimListTest[curTrial].category == 'a circle'){
        //for the circle trial, show the circle image for 2s and hide it.

        var imageurl = "url('" + stimListTest[curTrial].image + "')";
        $('#sketchpad').css("background-image", imageurl)
            .css("background-size",imgSize)
            .css("background-repeat", "no-repeat")
            .css("background-position","center center");

        setTimeout(function () {
            $('#sketchpad').css("background-image", "");
        }, 2000);

    }else if(curTrial == maxTrials-1){
        $("#submit_div").hide();
        $("#lastTrial").show();
    }

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
        clickedSubmit =1 // it's as if we clicked submit
        disableDrawing = true
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
        colname: version,
        location: mode,
        trialNum: curTrial,
        time: Date.now(),
        date: readable_date,
        age: age}; // age

    // send data to server to write to database
    socket.emit('current_data', current_data);

    //change the color of current drawing in the sketchpad as grey

};


// experiment navigation functions
function showConsentPage(){
    $('#landingPage').hide();
    $(consentPage).show();
    $('#parent-email').attr('placeholder', 'Input your email address here').val('');
    $('#email-form').show();
    $('#email-sent').hide();

}

function restartExperiment() {
    project.activeLayer.removeChildren();
    curTrial=0;
    clickedSubmit=0;
    tracing = true
    sessionId='stationPilot1_' + Date.now().toString()
    $('.ageButton').removeClass('active');
    $('#endGame').removeClass('bounce');
    $(thanksPage).hide();
    $('#landingPage').show(); // fade in the landing page
    $('#checkConsent').prop('checked', false); // uncheck consent box
    $(".nameInput").val("");
}

function endExperiment(){
    $(thanksPage).show();
    curTrial = -1;
    //wait for 1min and restart
    setTimeout(function(){
        if(curTrial == -1) {
            console.log("restart after 15 second");
            restartExperiment()
        }
    }, 60000);
}

function increaseTrial(){
    saveSketchData() // save first!
    curTrial=curTrial+1; // increase counter

    // if (curTrial==maxTrials){
    //     project.activeLayer.removeChildren();
    //     $('#mainExp').hide();
    //     $('#drawing').hide();
    //     endExperiment();
    // }
}

function isDoubleClicked(element) {
    //if already clicked return TRUE to indicate this click is not allowed
    if (element.data("isclicked")) return true;

    //mark as clicked for 2 second
    element.data("isclicked", true);
    setTimeout(function () {
        element.removeData("isclicked");
    }, 2000);

    //return FALSE to indicate this click was allowed
    return false;
}

window.onload = function() {
    document.ontouchmove = function(event){
        event.preventDefault();
    }

    $('#startConsent').click(function(e) {
        e.preventDefault()
        showConsentPage();
    });

    $('.startExp').click(function (e) {
        e.preventDefault()
        if (isDoubleClicked($(this))) return;
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
            if ($("#checkConsent").is(':checked')) {
                startDrawing();
            }
            else {
                alert("Can we use your child's drawings? If so, please click the box above to start drawing!")
            }
        }

    });

    $('#keepGoing').click(function(e) {
        e.preventDefault()
        if (isDoubleClicked($(this))) return;
        $('#keepGoing').removeClass('bounce')

        console.log('touched next trial button');
        if(clickedSubmit==0){// if the current trial has not timed out yet
            clickedSubmit=1; // indicate that we submitted - global variable
            increaseTrial(); // save data and increase trial counter
        }

        $('#drawing').hide();
        project.activeLayer.removeChildren();
        startDrawing();
    });

    $('.allDone').click(function(e) {
        e.preventDefault()
        if (isDoubleClicked($(this))) return;

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

    $('.endRestart').click(function(e){
        e.preventDefault()
        if (isDoubleClicked($(this))) return;
        console.log('restart to the landing page')
        restartExperiment()
    });


    $('#sendEmail').click(function(e){
        e.preventDefault()
        if (isDoubleClicked($(this))) return;
        var email = $('#parent-email').val()
        $.get("/send", {email:email}, function(data){
            if(data=="sent"){
                $('#email-form').hide()
                $('#email-sent').show()
            }else{
                alert('invalid email')
            }
        });
    });

    $('.ageButton').click(function(e){
        e.preventDefault()
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
                colname: version,
                location: mode,
                trialNum: curTrial,
                time: Date.now(),
                date: readable_date
                age: age
            };

            // send stroke data to server
            console.log(stroke_data)
            socket.emit('stroke',stroke_data);
        }
    }

    var paths = [];
    function touchStart(ev) {
        if(disableDrawing){
            return;
        }

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

    //Refresh if no user activities in 60 seconds
    var time = new Date().getTime();
    $(document.body).bind("touchstart touchmove touchend click", function(e) {
        time = new Date().getTime();
    });

    var refreshTime = 60000
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


    // function preventZoom(event){
    // if(event.touches.length > 1){
    //     //the event is multi-touch
    //     //you can then prevent the behavior
    //     event.preventDefault()
    //     console.log("trying to prevent zoom")
    //     }, {passive: false}
    // }

    // $('cueVideo').bind('touchmove', false);
    // $('cueVideoDiv').bind('touchmove', false);

    // videoBox = document.getElementById("cueVideo");
    // // videoBox.addEventListener("touchstart", preventZoom, false);

    // videojs("cueVideo",{controlBar: {fullscreenToggle: false}}).ready(function(){
    //     myPlayer = this;
    //     myPlayer.on("fullscreenchange", function(){
    //         if(myPlayer.isFullscreen()){
    //             myPlayer.exitFullscreen();
    //             console.log("prevented fullscreen")
    //         }
    //     });
    // });


} // on document load





