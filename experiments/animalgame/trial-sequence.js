/* 

Handles dynamic elements of animalgame task
Nov 2018

*/

// 0. Load dependencies
paper.install(window);
socket = io.connect();

// set global variables
var curTrial=1 // global variable, trial counter : SET TO 1 FOR DEBUGGING, SHOULD BE 0
var clickedSubmit=0; // whether an image is submitted or not
var language = "English";

// current mode and session info
var mode = "CDM";
var version ="animalgame_run_pilot";
var sessionId= version + Date.now().toString();
var consentPage = '#consentCDM';
var thanksPage = "#thanksPage";
var checkBoxAlert = "Can we use your child's drawings? If so, please click the box above to start drawing!";
var ageAlert = "Please select your age group.";


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

//
function getButtonCategory(clicked_id) {
    return function(element) {
        return (element.buttonIndex == clicked_id)
        alert('get button category')
    }
}

function clickResponse(clicked_id){
    temp = buttonList.filter(getButtonCategory(clicked_id))
    curr_category = stimListTest[curTrial].category
    clicked_category = temp[0].category
    if (curr_category == clicked_category){
        alert('correct')
        // play cool sound here?
    } 
    // alert(clicked_category)
    saveGuessData(clicked_category) // save first!
    increaseTrial(); // save data and increase trial counter
}

function increaseTrial(){
    // increase trial counter
    curTrial=curTrial+1; 

    // clear canvas
    var canvas = document.getElementById("sketchpad"),
        ctx=canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height)

    // wait 2 seconds
    setTimeout(function() {
        startGuessing()
    }, 2000);
    
}


function startGuessing(){
    maxTrials = stimListTest.length;
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
	// var imageurl = "url('" + stimListTest[curTrial].image + "')";
    var imageurl = stimListTest[curTrial].image;
    var canvas = document.getElementById('sketchpad');
    context = canvas.getContext('2d');
    context.drawImage(imageurl,canvas.width*.2,canvas.height*.2,canvas.width*.8,canvas.height*.8)
    
    // load it into the sketchpad
    // var imgSize = "100%";
    // $('#sketchpad').fadeIn('fast');
    // $('#sketchpad').css("background-image", imageurl)
    //     .css("background-size",imgSize)
    //     .css("background-repeat", "no-repeat")
    //     .css("background-position","center center");
}

function monitorProgress(){
    clickedSubmit=0;
    startTrialTime=Date.now()
    // console.log('starting monitoring')
    // $('.progress').show(); // don't show progress bar until we start monitorung
    // progress(timeLimit, timeLimit, $('.progress')); // show progress bar
};



//  monitors the progress and changes the js elements associated with timeout bar
// function progress(timeleft, timetotal, $element) {
//     var progressBarWidth = timeleft * $element.width()/ timetotal;
//     var totalBarWidth = $element.width();
//     $element.find('.progress-bar').attr("aria-valuenow", timeleft).text(timeleft)
//     $element.find('.progress-bar').animate({ width: progressBarWidth }, timeleft == timetotal ? 0 : 1000, "linear");
//     console.log("clicked submit = " + clickedSubmit)
//     console.log("time left = " + timeleft)

//     if(timeleft > 0 & clickedSubmit==0) {
//         setTimeout(function() {
//             progress(timeleft - 1, timetotal, $element);
//         }, 1000);
//     }
//     else if(timeleft == 0 & clickedSubmit==0){
//         console.log("trial timed out")
//         increaseTrial();
//         clickedSubmit = 1 // it's as if we clicked submit
//         disableDrawing = true // can't draw after trial timed out
//         $("#sketchpad").css({"background":"linear-gradient(#17a2b81f, #17a2b81f)", "opacity":"0.5"});
//         return; //  get out of here
//     }
//     else if (clickedSubmit==1){
//         console.log("exiting out of progress function")
//         $element.find('.progress-bar').width(totalBarWidth)
//         return; //  get out of here, data being saved by other button
//     }
// };

function saveGuessData(clicked_category){
// NEEDS MODIFICTIONS
// get critical trial variables
    var clicked_category = clicked_category
    var category = stimListTest[curTrial].category;
    var age = $('.active').attr('id');

    // test stirng
    readable_date = new Date();
    current_data = {
                dataType: 'finalImage',
                sessionId: sessionId, // each child
                category: category, // drawing category
                clicked_category: clicked_category, // clicked category
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
    $('#drawing').hide();
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
    // $('.keepGoingButton').bind('touchstart mousedown',function(e) {
    //     e.preventDefault()
    //     alert('got here')
    //     console.log('touched next trial button');
    //     if(clickedSubmit==0){// if the current trial has not timed out yet
    //         clickedSubmit=1; // indicate that we submitted - global variable
    //         increaseTrial(); // save data and increase trial counter
    //     }
    //     startGuessing(); // start the new trial
    // });

    $('.allDone').bind('touchstart mousedown',function(e) {
        e.preventDefault()

        console.log('touched endExperiment  button');
        if(clickedSubmit==0){// if the current trial has not timed out yet
            clickedSubmit=1; // indicate that we submitted - global variable
            increaseTrial(); // save data and increase trial counter
        }
        $('#mainExp').hide();
        $('#drawing').hide();
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

    /////////////// RESIZE SKETCHPAD WINDOW
    var canvas = document.getElementById("sketchpad"),
        ctx=canvas.getContext("2d");
    canvas.height = window.innerWidth*.80; // set to 80% of the actual screen
    canvas.width = canvas.height;


    // In general, refresh if no user activities in 90 seconds
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


    // randomize order that the buttons appear in for different runs of the game
    // categories = ['bird','dog','frog','cat','fish','rabbit'] // animals
    categories = ['bird','bike','house','hat','car','chair'] // debugging only
    // categories = shuffle(categories)
    buttonList = []

    for(var j = 0; j < (categories.length); j++){
            this_category = categories[j]
            this_index = j+1
            this_button_image_index = "keepGoing" + "_" + this_index
            this_button_txt_index = "keepGoing" + "_" + this_index + "_" + "txt"
            
            // Push all of the relevant info into the stimuli list; requires videos and images to be named correctly!
            buttonList.push({"buttonIndex": this_button_image_index, "category": this_category, "image": "images_photocues/" + this_category + "_" + getRandomInt(1, 3) + ".png"});
            console.log(j)
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
                sketch_categories = ['cat','chair'] // debugging only - will be, categories = ['bird','bike','house','hat','car','chair'] 
                ages = ['age7','age8']             // debugging only - , will be ages = ['age3','age4','age5','age6','age7','age8','age9']
                numImagePerCat = 1; stimListTest = []

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
                            random_sketch = sketch_subset[random_index];
                            // Push all of the relevant info into the stimuli list; requires sketches to be named correctly...
                            stimListTest.push({"age": this_age, "category": this_sketch_category, "random_index": random_index, "image": random_sketch});
                    }
                } 
                /////
                result = stimListTest;
            }, // success in ajax
                error: function() {
                    alert('ajax error occured');
                }
    }); // ajax
    
} // on document load





