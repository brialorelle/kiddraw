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
var firstTrial = {"condition":"S","stimulus":{"category": "this circle", "video": "copy_circle.mp4", "image":"images/circle.png"}}

var trace1 = {"condition":"S","stimulus":{"category":"this square", "video": "trace_square.mp4", "image":"images/square.png"}}
var trace2 = {"condition":"S","stimulus":{"category":"this shape", "video": "trace_shape.mp4","image":"images/shape.png"}}

var catList = [{"category":"cat", "video": "cat.mp4", "image":"images/photocues/cat.jpg", "audio_perception":"audio_perception_louder/cat.wav", "audio_wm":"audio_wm/cat.wav"},
    {"category": "shoe", "video": "shoe.mp4","image":"images/photocues/shoe.jpg","audio_perception":"audio_perception_louder/shoe.wav", "audio_wm":"audio_wm/shoe.wav"},
    {"category": "rabbit", "video": "rabbit.mp4","image":"images/photocues/rabbit.jpg", "audio_perception":"audio_perception_louder/rabbit.wav", "audio_wm":"audio_wm/rabbit.wav"},
    {"category": "train", "video": "train.mp4","image":"images/photocues/train.jpg", "audio_perception":"audio_perception_louder/train.wav", "audio_wm":"audio_wm/train.wav"},
    {"category": "cup", "video": "cup.mp4","image":"images/photocues/cup.jpg", "audio_perception":"audio_perception_louder/cup.wav", "audio_wm":"audio_wm/cup.wav"}]



var curTrial=0 // global variable, trial counter

// set global variables
var clickedSubmit=0; // whether an image is submitted or not
var tracing = true; //whether the user is in tracing trials or not
var maxTraceTrial = 2; //the max number of tracing trials
var timeLimit=30;
var disableDrawing = false; //whether touch drawing is disabled or not
var language = "English";

// current mode and session info
var mode = "CDM";
var version =mode + "_photodraw" + "_e1";
var sessionId= version + Date.now().toString();

var consentPage = '#consentBing';
var thanksPage = "#thanksBing";
var maxTrials;
var stimList = [];
var subID = $('#subID').val();

function getStimuliList (){
    // var conditionDic = {"1":["W","P","S"],
    //     "2":["W","S","P"],
    //     "3":["S","P","W"],
    //     "4":["S","W","P"],
    //     "5":["P","S","W"],
    //     "6":["P","W","S"]}
    var cbGroup = $('#cbGroup').val();


    // var conditions = conditionDic[cbGroup];
    // var curCondition = 0;

    // for(var i = 0; i < conditions.length; i++){
    //     var currentStimOrder = shuffle(catList);
    //     stimList.push({"condition":conditions[i], "stimulus":pracTrial});
    //     for(var j = 0; j < currentStimOrder.length; j++){
    //         stimList.push({"condition":conditions[i], "stimulus":currentStimOrder[j]});
    //     }
    // }

    var currentStimOrder = shuffle(catList);
    for(var j = 0; j < currentStimOrder.length; j++){
            stimList.push({"condition":cbGroup, "stimulus":currentStimOrder[j]});
    }

    stimList.unshift(firstTrial);
    stimList.unshift(trace2);
    stimList.unshift(trace1);
    maxTrials = stimList.length;
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
        $(consentPage).hide(); // fade out age screen
        getStimuliList()
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


function showTaskChangeVideo(callback){

    console.log("time for something new")
    $('#photocue').hide();
    var player = loadChangeTaskVideo(); // change video
    // set volume again
    var video = document.getElementById('cueVideo');
    video.volume = 1;
    drawNext = 0;
    document.getElementById("drawingCue").innerHTML =  " &nbsp; &nbsp;  &nbsp; "
    setTimeout(function() {playVideo(player, drawNext);},1000);
};


function showTrial(){
    // Semantic trials
    if (stimList[curTrial].condition == 'S'){
        var player = loadNextVideo(curTrial); // change video

        if (tracing || stimList[curTrial].stimulus.category == "this circle"){
            document.getElementById("drawingCue").innerHTML =  stimList[curTrial].stimulus.category
        }
        else{
            document.getElementById("drawingCue").innerHTML = "a "+ stimList[curTrial].stimulus.category
        }
        $('#photocue').hide();

        // set volume again
        var video = document.getElementById('cueVideo');
        video.volume = 1;
        drawNext = 1;
        setTimeout(function() {playVideo(player, drawNext);},1000);
    }
    // Working memory trials
    else if (stimList[curTrial].condition == 'W'){
        document.getElementById("drawingCue").innerHTML = "a "+ stimList[curTrial].stimulus.category
        $('#cueVideoDiv').hide();
        var imgPath = stimList[curTrial].stimulus.image;
        $("#photocue").attr("src",imgPath);
        $('#photocue').fadeIn();
        var audio = new Audio(stimList[curTrial].stimulus.audio_wm);
        audio.volume = 1;
        audio.play();
        setTimeout(
            function() {
                $('#photocue').hide()
                setUpDrawing()
            },
            6000)
    }
    // Perception trails
    else{
        document.getElementById("drawingCue").innerHTML = "this "+ stimList[curTrial].stimulus.category
        $('#cueVideoDiv').hide();
        var imgPath = stimList[curTrial].stimulus.image;
        $("#photocue").attr("src",imgPath);
        $('#photocue').fadeIn();
        var audio = new Audio(stimList[curTrial].stimulus.audio_perception);
        audio.volume = 1;
        audio.play();
        setTimeout(
            function() {
                setUpDrawing();
            },
            6000);
    }
}

//
function beginTrial(){
    $('#progressBar_Button').hide();
    $('#sketchpad').hide();
    $('#mainExp').fadeIn('fast');

    // cup is ALWAYS first, as it is the practice trial
    // if (stimList[curTrial].stimulus.category == 'cup') {
    if (curTrial==3) {
        showTaskChangeVideo();
    }
    else{
        showTrial();
    }
}

// video player functions
function playVideo(player, drawNext){
    player.ready(function() { // need to wait until video is ready
        $('#cueVideoDiv').fadeIn(); // show video div only after video is ready

        this.play();
        this.on('ended', function () {

            // only want to start drawing if we are not on the "something new" video
            if (drawNext == 1) {
                console.log('video ends and drawing starts');
                $('#cueVideoDiv').fadeOut(); 
                setTimeout(function(){
                    player.dispose(); //dispose the old video and related eventlistener. Add a new video
                }, 500);
                setUpDrawing();

            }
            else {
                console.log('starting normal trials...something new');
                $('#cueVideoDiv').fadeOut();
                setTimeout(function(){
                    player.dispose(); //dispose the old video and related eventlistener. Add a new video
                }, 500);

                // add slight delay between something new and start of new trials
                setTimeout(function () {
                    showTrial();
                }, 1000);
            }
        });
    });
}

function loadChangeTaskVideo(){
    $("#cueVideoDiv").html("<video id='cueVideo' class='video-js' playsinline poster='https://dummyimage.com/320x240/ffffff/fff'> </video>");
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

    player.src({ type: "video/mp4", src: "videos_new/something_new.mp4" });
    player.load();
    return player;
}

function loadNextVideo(){
    $("#cueVideoDiv").html("<video id='cueVideo' class='video-js' playsinline poster='https://dummyimage.com/320x240/ffffff/fff' >  </video>");
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
    console.log(stimList[curTrial].stimulus.video)
    player.src({ type: "video/mp4", src: "videos_new/" + stimList[curTrial].stimulus.video });
    player.load();
    return player;
}

function setUpDrawing(){
    var imgSize = "70%";
    disableDrawing = false;
    $('#sketchpad').css({"background": "", "opacity":""});

    if (tracing){
        //for all tracing trials, show the tracing image on the canvas

        var imageurl = "url('" + stimList[curTrial].stimulus.image + "')";
        $('#sketchpad').css("background-image", imageurl)
            .css("background-size",imgSize)
            .css("background-repeat", "no-repeat")
            .css("background-position","center center");
        $("#endMiddle").show();
        $("#keepGoing").show();
        $("#endGame").hide();

    }else if(stimList[curTrial].stimulus.category == 'this circle'){
        //for the circle trial, show the circle image for 1s and hide it.

        var imageurl = "url('" + stimList[curTrial].stimulus.image + "')";
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

    $('#progressBar_Button').show()
    $('#sketchpad').show()
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
    var category = stimList[curTrial].stimulus.category;
    var condition = stimList[curTrial].condition;
    var age = $('.active').attr('id');
    var firstName = $('#firstName').val();
    var lastName = $('#lastName').val();
    var cbGroup = $('#cbGroup').val();
    var subID = $('#subID').val();
    var name;
    if (firstName != "") {
        name = firstName.toUpperCase() + ' ' + lastName.toUpperCase()
    }

    // test stirng
    readable_date = new Date();
    current_data = {
        dataType: 'finalImage',
        sessionId: sessionId, // each children's session
        imgData: dataURL,
        category: category,
        condition:condition,
        dbname:'kiddraw',
        colname: version,
        location: mode,
        trialNum: curTrial,
        time: Date.now(),
        date: readable_date,
        age: age,
        subID: subID,
        kidName: name,
        counter_balancing: cbGroup};

    // send data to server to write to database
    socket.emit('current_data', current_data);
};


function setLanguage(lang){
    //If the user choose English, no change on the webpage
    if (lang=="English") return;

    //If the user choose other langauges
    var filename = "language/"+lang +".json";
    $.getJSON(filename, function( data ) {
        var items = [];
        $.each( data.webpage, function( key, val ) {
            if (key=="parentEmail"){
                $("#parentEmail").attr("placeholder",val);
            }else {
                var id = "#" + key;
                $(id).text(val);
            }
        });
    });
}

// experiment navigation functions
function showConsentPage(){
    // if (mode == "CDM") {
    //     $("#chooseLang").hide();
    // }else {
        $("#landingPage").hide();
    // }
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


    document.ontouchmove = function(event){
        event.preventDefault();
    }


    $('#startConsent').bind('touchstart mousedown',function(e) {
        e.preventDefault()
        if ($("#cbGroup").val().trim().length==0){
                alert("Please let the researcher enter your condition.");
            }
        else{
            showConsentPage();
        }
        // }
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
            }
            else if ($("#cbGroup").val().trim().length==0){
                alert("Please let the researcher enter your group number.");
            }
            else{
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
        canvas.height = window.innerHeight*.68;
        canvas.width = canvas.height;
    }
    // portrait mode -- resize to height
    else if(window.innerWidth < window.innerHeight){
        canvas.height = window.innerHeight*.68;
        canvas.width = canvas.height;
    }


    // Drawing related tools
    paper.setup('sketchpad');

    function sendStrokeData() {
        for(var i = 0; i < paths.length; i++){
            var path = paths[i];
            path.selected = false

            var svgString = path.exportSVG({asString: true});
            var category = stimList[curTrial].stimulus.category;
            var condition = stimList[curTrial].condition;
            var readable_date = new Date();
            var age = $('.active').attr('id');
            var firstName = $('#firstName').val();
            var lastName = $('#lastName').val();
            var cbGroup = $('#cbGroup').val();
            var subID = $('#subID').val();
            var name;
            if (firstName != "") {
                name = firstName.toUpperCase() + ' ' + lastName.toUpperCase()
            }

            stroke_data = {
                dataType: 'stroke',
                sessionId: sessionId,
                svg: svgString,
                category: category,
                condition:condition,
                dbname:'kiddraw',
                colname: version,
                location: mode,
                trialNum: curTrial,
                time: Date.now(),
                date: readable_date,
                age: age,
                subID: subID,
                kidName: name,
                counter_balancing: cbGroup
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
        path.strokeWidth = 5;
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





