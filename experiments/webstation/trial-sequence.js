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
firstTrial = {"category": "this circle", "video": "circle.mp4louder.mp4", "image":"images/circle.png"}
lastTrial = {"category": "something you love", "video": "love.mp4louder.mp4"}
trace1 = {"category":"square", "video": "square.mp4louder.mp4", "image":"images/square.png"}
trace2 = {"category":"shape", "video": "shape.mp4louder.mp4","image":"images/shape.png"}
var stimListTest = [{"category": "a boat", "video": "boat.mp4louder.mp4"},
    {"category": "a car", "video": "car.mp4louder.mp4"},
    {"category": "a cup", "video": "cup.mp4louder.mp4"},
    {"category": "a dog", "video": "dog.mp4louder.mp4"},
    {"category": "a fish", "video": "fish.mp4louder.mp4"},
    {"category": "a house", "video": "house.mp4louder.mp4"},
    {"category": "a tree", "video": "tree.mp4louder.mp4"},
    {"category": "a person", "video": "person.mp4louder.mp4"} ]

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

// set global variables
var clickedSubmit=0; // whether an image is submitted or not
var tracing = true; //whether the user is in tracing trials or not
var maxTraceTrial = 2; //the max number of tracing trials
var timeLimit=30;
var disableDrawing = false; //whether touch drawing is disabled or not
var language = "English";

// current mode and session info
var mode = "Bing";
var version =mode + "run" + "_v1"
var sessionId= version + Date.now().toString();

var consentPage = '#consentBing';
var thanksPage = "#thanksBing";

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
    // set volume again
    var video = document.getElementById('cueVideo');
    video.volume = 1;
    //
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

// show cue without canvas
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
            hideCue();
            this.dispose(); //dispose the old video and related eventlistener. Add a new video
            $("#cueVideoDiv").html("<video id='cueVideo' class='video-js' playsinline> </video>");
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
    var player=videojs('cueVideo',
        {
            "controls": false,
            "preload":"auto"
        },
        function() {
            this.volume(1);
        }
    );
    player.pause();
    player.volume(1); // set volume to max
    console.log(stimListTest[curTrial].video)
    player.src({ type: "video/mp4", src: "videos_louder/" + stimListTest[curTrial].video });
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
        $("#endMiddle").show();
        $("#keepGoing").show();
        $("#endGame").hide();

    }else if(stimListTest[curTrial].category == 'this circle'){
        //for the circle trial, show the circle image for 2s and hide it.

        var imageurl = "url('" + stimListTest[curTrial].image + "')";
        $('#sketchpad').css("background-image", imageurl)
            .css("background-size",imgSize)
            .css("background-repeat", "no-repeat")
            .css("background-position","center center");

        setTimeout(function () {
            $('#sketchpad').css("background-image", "");
        }, 1000);

    }else if(curTrial == maxTrials-1){
        $("#endMiddle").hide();
        $("#keepGoing").hide();
        $("#endGame").show();
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
        if($("#endGame").css("display")!="none"){
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
    var name;

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
        age: age};

    // send data to server to write to database
    socket.emit('current_data', current_data);
};



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
    //wait for 1min and restart
    setTimeout(function(){
        if(curTrial == -1) {
            console.log("restart after 60 seconds");
            restartExperiment()
        }
    }, 60000);
}

function increaseTrial(){
    saveSketchData() // save first!
    curTrial=curTrial+1; // increase counter
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


    $('#startConsent').bind('touchstart mousedown',function(e) {
        e.preventDefault()
        showConsentPage();
    });

    $('.langButton').bind('touchstart mousedown',function(e) {
        e.preventDefault()
        // if (isDoubleClicked($(this))) return;
        language = $(this).attr('id');
        setLanguage(language);
        showConsentPage();
    });

    $('.startExp').bind('touchstart mousedown',function (e) {
        e.preventDefault()
        // if (isDoubleClicked($(this))) return;

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
                alert("Can we use your child's drawings? If so, please click the box above to start drawing!")
            }else if($(".active").val()==undefined){
                alert("Please select your age group.")
            }
            else {
                startDrawing();
            }
        }

    });

    $('#keepGoing').bind('touchstart mousedown',function(e) {
        e.preventDefault()
        // if (isDoubleClicked($(this))) return;

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

    $('.endRestart').bind('touchstart mousedown',function(e){
        e.preventDefault()
        // if (isDoubleClicked($(this))) return;

        console.log('restart to the landing page')
        restartExperiment()
    });


    $('#sendEmail').bind('touchstart mousedown',function(e){
        e.preventDefault()

        // if (isDoubleClicked($(this))) return;
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

    $('.ageButton').bind('touchstart mousedown',function(e){
        e.preventDefault()
        $('.ageButton').removeClass('active')
        $(this).addClass('active')
    });

    //
    var canvas = document.getElementById("sketchpad"),
        ctx=canvas.getContext("2d");
    //landscape mode 00 inne
    if (window.innerWidth > window.innerHeight){
        canvas.height = window.innerHeight*.80;
        canvas.width = canvas.height;
    }
    // portrait mode -- resize to height
    else if(window.innerWidth < window.innerHeight){
        canvas.height = window.innerHeight*.80;
        canvas.width = canvas.height;
    }


    // Drawing related tools
    paper.setup('sketchpad');
    var tool = new Tool();
    var path;

    function sendStrokeData() {
        path.selected = false

        var svgString = path.exportSVG({asString: true});
        var category = stimListTest[curTrial].category;
        var readable_date = new Date();
        var age = $('.active').attr('id');
        var firstName = $('#firstName').val();
        var lastName = $('#lastName').val();


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
            date: readable_date,
            age: age,
        };

        // send stroke data to server
        console.log(stroke_data)
        socket.emit('stroke',stroke_data);

    }

    tool.onMouseDown = function (ev) {
        if(disableDrawing){
            return;
        }

        console.log("mouse down");
        // Create new path per mousedown
        path = new Path();
        path.strokeColor = 'black';
        path.strokeCap = 'round'
        path.strokeWidth = 7;

        path.add(ev.point);
        view.draw();
    }

    tool.onMouseDrag = function(ev) {
        if(disableDrawing){
            return;
        }

        console.log("mouse move");
        path.add(ev.point);
        view.draw();

    }

    tool.onMouseUp = function(ev){
        if(disableDrawing){
            return;
        }

        console.log("mouse up");
        sendStrokeData()

    }


    // //Refresh if no user activities in 90 seconds
    // var time = new Date().getTime();
    //     $(document.body).bind("touchstart touchmove touchend click", function(e) {
    //     time = new Date().getTime();
    // });

    // var refreshTime = 120000
    // function refresh() {
    //     if (new Date().getTime() - time >= refreshTime) {
    //         if($("#landingPage").css("display")=="none") {
    //             window.location.reload(true);
    //             console.log("No user activities. Reload.")
    //         }else{
    //             //if the current page is the landingPage, reset time and wait again
    //             time = new Date().getTime();
    //             setTimeout(refresh, refreshTime);
    //         }
    //     } else {
    //         setTimeout(refresh, refreshTime);
    //     }

    // }

    // setTimeout(refresh, refreshTime);


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





