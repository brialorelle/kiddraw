/* 

Handles dynamic elements of museumdraw task
Oct 26 2017

*/

// 0. Load dependencies
paper.install(window);
socket = io.connect();






// 1. Setup trial order and randomize it!
firstTrial = {"category": "this square", "video": "copy_square.mp4", "image":"images/square.png"}
lastTrial = {"category": "something you love", "video": "love.mp4"}
trace1 = {"category":"square", "video": "trace_square.mp4", "image":"images/square.png"}
trace2 = {"category":"shape", "video": "trace_shape.mp4","image":"images/shape.png"}
intro = {"category":"intro", "video": "intro.mp4","image":"images/lab_logo_stanford.png"}

// round 1 -- finished June 1, 2018
var stimListTest = [{"category": "a bear", "video": "bear.mp4"},
    {"category": "a cat", "video": "cat.mp4"},
    {"category": "a frog", "video": "frog.mp4"},
    {"category": "a sheep", "video": "sheep.mp4"},
    {"category": "a key", "video": "key.mp4"},
    {"category": "a phone", "video": "phone.mp4"},
    {"category": "a scissors", "video": "scissors.mp4"},
    {"category": "a train", "video": "train.mp4"} ]

var stimListTest = shuffle(stimListTest)
stimListTest.push(lastTrial)
stimListTest.unshift(firstTrial)


var curTrial=1 // global variable, trial counter
var maxTrials = stimListTest.length; //
var stimLang = {
    "this square": "this square",
    "square": "square",
    "shape": "shape",
    "a bear": "a bear",
    "a cat": "a cat",
    "a sheep": "a sheep",
    "a key": "a key",
    "a phone": "a phone",
    "a train": "a train",
    "a frog": "a frog",
    "a scissors": "a pair of scissors",
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
maxTraceTrial = maxTraceTrial + 1 // add one because the intro technically gets logged as a trial
var timeLimit=30;
var disableDrawing = false; //whether touch drawing is disabled or not
var language = "English";
var strokeThresh = 3; // each stroke needs to be at least this many pixels long to be sent

// current mode and session info
var mode = "CDM";
var version ="animalgame_run_pilot";
var sessionId= version + Date.now().toString();
var consentPage = '#consentCDM';
var thanksPage = "#thanksPage";


// shuffling functions
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

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





function startGuessing(){
    if (curTrial==0){
        $(consentPage).fadeOut('fast'); // fade out age screen
        showIntroVideo();  
    }
    else if (curTrial>0 && curTrial<maxTrials) {
    	console.log('starting non-intro trial')
     	$(consentPage).fadeOut('fast'); // fade out age screen
     	$('#drawing').fadeIn('fast'); // fade out age screen
        beginTrial()
    }
    else if (curTrial==maxTrials){
        endExperiment();
    }
}

// intro video before first thing happens
function showIntroVideo(){
    // var player = loadNextVideo(curTrial); // change video
    document.getElementById("cue").innerHTML = "This game is for only one person at a time. Please draw by yourself!";
    $('#mainExp').fadeIn('fast');
    // setTimeout(function() {playVideo(player);},1000);
}

// for the start of each trial
function beginTrial(){
    //
    showNextSketch(curTrial)
    monitorProgress(); // start the timeout function (10s)?
    $('#mainExp').fadeIn('fast'); // fade in exp
}

function showNextSketch(){
	// get image from somewhere
	var imageurl = "url('" + stimListTest[curTrial].image + "')";
    // load it into the sketchpad
    var imgSize = "70%";
    $('#sketchpad').fadeIn('fast');
    $('#sketchpad').css("background-image", imageurl)
        .css("background-size",imgSize)
        .css("background-repeat", "no-repeat")
        .css("background-position","center center");
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
        $("#sketchpad").css({"background":"linear-gradient(#17a2b81f, #17a2b81f)", "opacity":"0.5"});
        return; //  get out of here
    }
    else if (clickedSubmit==1){
        console.log("exiting out of progress function")
        $element.find('.progress-bar').width(totalBarWidth)
        return; //  get out of here, data being saved by other button
    }
};

function saveGuessData(){
// NEEDS MODIFICTIONS
// get critical trial variables
    var category = stimListTest[curTrial].category;
    var age = $('.active').attr('id');

    // test stirng
    readable_date = new Date();
    current_data = {
                dataType: 'finalImage',
                sessionId: sessionId, // each child
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
}


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
   var parent_guessed = document.getElementById("survey_parent").checked
   var child_guessed = document.getElementById("survey_child").checked
   var other_guessed = document.getElementById("survey_else").checked

   current_data = {
   				parent_guessed: parent_guessed,
   				child_guessed: child_guessed,
   				other_guessed: other_guessed,
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
    saveGuessData() // save first!
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
                startGuessing();
            }

        }else{
            console.log("CDM");
            if (!$("#checkConsent").is(':checked')) {
                alert(checkBoxAlert)
            }else if($(".active").val()==undefined){
                alert(ageAlert)
            }
            else {
                startGuessing();
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

        // $('#drawing').hide(); // hide the canvas
        // project.activeLayer.removeChildren(); // clear the canvas
        startGuessing(); // start the new trial
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

    /////////////// RESIZE IMG WINDOW
    var canvas = document.getElementById("sketchpad"),
        ctx=canvas.getContext("2d");
    canvas.height = window.innerWidth*.80; // set to 80% of the actual screen
    canvas.width = canvas.height;


    // // Initialize paper.js
    // paper.setup('sketchpad');

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


    // randomize order that the buttons appear in
    // categories = ['bird','dog','frog','cat','fish','rabbit'] // animals
    categories = ['bird','bike','house','hat','car','chair'] // debugging only
    categories = shuffle(categories)
    buttonList = []

    for(var j = 0; j < (categories.length); j++){
            this_category = categories[j]
            this_index = j+1
            this_button_image_index = "keepGoing" + "_" + this_index
            this_button_txt_index = "keepGoing" + "_" + this_index + "_" + "txt"
            // Push all of the relevant info into the stimuli list; requires videos and images to be named correctly!
            buttonList.push({"buttonIndex": this_button_image_index, "category": this_category, "image": "images_photocues/" + this_category + "_" + getRandomInt(1, 3) + ".png"});

            document.getElementById(this_button_txt_index).innerHTML = this_category;
            document.getElementById(this_button_image_index).src = buttonList[j].image;
    }

    // LOAD SKETCH NAMES
    $.ajax({
        type: "GET",
        url: "sketchNames.csv",
        dataType: "text",
        success: function(data) {
                results = Papa.parse(data); // parse csv file

                //set up image names
                imgArray = new Array();
                for (i = 1; i < results.data.length; i++) {
                    var session_id= results.data[i][0]; //starts i at 1 to get rid of header
                    var category = results.data[i][2];
                    var age = results.data[i][3];
                    imgArray[i] = new Image();
                    imgArray[i].src = ['sketches/' + category + '/' +  category + '_sketch_' + age + '_' + session_id + '.png'];
                    imgArray[i].category = category;
                    imgArray[i].age = "age" + age;
                }
            
            // SET UP TRIAL STRUCTURE
            sketch_categories = ['cat','chair']
            ages = ['age7','age8']
            // categories = ['bird','bike','house','hat','car','chair'] // debugging only
            // ages = ['age3','age4','age5','age6','age7','age8','age9']

            numTrials = sketch_categories.length * ages.length
            numImagePerCat = 2
            trialList = []
            // function to get subset of sketches based on age/category
            function getSubset(this_category,this_age) {
                return function(element) {
                    return (element.category == this_category &&
                            element.age == this_age)
                }
            }

            // get random sketch
            for(var j = 0; j < (sketch_categories.length); j++){
                    this_sketch_category = sketch_categories[j]
                        for (var a = 0; a < (ages.length); a++){
                        this_age = ages[a]
                        random_index = getRandomInt(1,numImagePerCat);
                        sketch_subset = imgArray.filter(getSubset(this_sketch_category, this_age));
                        random_sketch = sketch_subset[random_index].src;
                        // Push all of the relevant info into the stimuli list; requires sketches to be named correctly...
                        trialList.push({"age": this_age, "category": this_sketch_category, "random_index": random_index, "image": "sketches/" + random_sketch});
                }
            }


            } // success in ajax
    }); // ajax

} // on document load





