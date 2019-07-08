/* 

Handles dynamic elements of animalgame task
Nov 2018

*/

// 0. Load dependencies
paper.install(window);
socket = io.connect();

// set global variables
var curTrial=0 // global variable, trial counter : SET TO 1 FOR DEBUGGING, SHOULD BE 0
var clickedSubmit=0; // whether an image is submitted or not
var language = "English";

// current mode and session info
var mode = "CDM";
var version ="objectgame_run_v1";
var sessionId= version + Date.now().toString();
var consentPage = '#consentCDM';
var thanksPage = "#thanksPage";
var checkBoxAlert = "Can we save your child's guesses? If so, please click the box above to start playing!";
var ageAlert = "Please select your age group.";
var numPracTrials = 4
var correctCount = 0 

////Audio set up
// set up feedback audio
var feedback = new Audio("audio/ping.wav");
feedback.volume = 1;

// set up feedback audio
var instructions = new Audio("audio/tap_object_picture.wav");
instructions.volume = 1;

var sketch_instructions = new Audio("audio/tap_object_drawing.wav");
sketch_instructions.volume = 1;


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



function clickResponse(clicked_id){
    //is triggered by functions attached to 
    temp = buttonList.filter(getButtonCategory(clicked_id))
    curr_category = stimListTest[curTrial].category // category of the sketch
    clicked_category = temp[0].category // this is set below by counterbalancing code; category of clicked button
    
    // in any case, give some feedback that we hit a button for 500 seconds
    $('#' + temp[0].buttonIndex).css({"border":"solid 7px #999"});
    setTimeout (function(){
            $('#' + temp[0].buttonIndex).css({"border":"none"});
        },500);
    
    if (curr_category == clicked_category){ // if corrrect
        feedback.play(); // play feedback noise

        // and change color of border around sketchpad
        $('#sketchpad').css({"border":"solid 10px #17a2b8"})
        setTimeout (function(){
            $('#sketchpad').css({"border":"solid 10px #999"});
        },750);
        if (curTrial>numPracTrials){
           correctCount = correctCount + 1
        }
    } 
    saveGuessData(clicked_category) // save first!
    increaseTrial(); // save data and increase trial counter
}

// used in above function to get category that was lickced
function getButtonCategory(clicked_id) {
    return function(element) {
        return (element.buttonIndex == clicked_id)
    }
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
    }, 1250);
    
}


function startGuessing(){
    maxTrials = stimListTest.length;
    if (curTrial==0){
        $(consentPage).fadeOut('fast'); // fade out age screen
        $('#sketchpad').hide();
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
    var player = loadNextVideo(curTrial); // change video
    // document.getElementById("cue").innerHTML = "This game is for only one person at a time. Please draw by yourself!";
    $('#mainExp').fadeIn('fast');
    setTimeout(function() {playVideo(player);},1000);
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
                // $('#cue').hide(); // fade out cue
                player.dispose(); //dispose the old video and related eventlistener. Add a new video
                if (curTrial==0) { // after intro
                    console.log('starting first trial')
                    curTrial = curTrial + 1
                    setTimeout(function() {beginTrial();},1000); /// start trial sequence after intro trial
                }
                else{ /// if not on introductory trial
                    alert('not sure what video you want!')
                }
                // reset video div?
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
    player.src({ type: "video/mp4", src: "videos/" + stimListTest[curTrial].video });
    player.load();
    return player;
}


// for the start of each trial
function beginTrial(){
    //
    if (curTrial==1) {
        $('#drawing').show();
        $('#sketchpad').show();
        instructions.play() // play instructions audio
    }
    else if (curTrial==(numPracTrials + 1)){
        sketch_instructions.play() // play sketch instructinos audio
    }
    
    showNextSketch(curTrial)
    // get start of trial time; set 
    clickedSubmit=0;
    startTrialTime=Date.now()
    $('#mainExp').fadeIn('fast'); // fade in exp
}

function showNextSketch(){
    // load sketch
    document.getElementById('sketch').src = stimListTest[curTrial].src
    this_image = document.getElementById('sketch');

    // get canvas
    var canvas = document.getElementById('sketchpad');
    context = canvas.getContext('2d');

    // define size of img & get x/y pos for centered in canvas
    img_width = canvas.width*.8; img_height = img_width; // show at 80% of canvas
    x_pos = canvas.width / 2 - img_width / 2,
    y_pos = canvas.height / 2 - img_height / 2

    // show sketch on  canvas only when loaded
    document.getElementById('sketch').onload = function (){
        context.drawImage(this_image,x_pos,y_pos,img_width,img_height)
    }
}



function saveGuessData(clicked_category){
    var clicked_category = clicked_category
    var intended_category = stimListTest[curTrial].category;
    var sketch_path = stimListTest[curTrial].src;
    var producer_age = stimListTest[curTrial].age;
    var recognizer_age = $('.active').attr('id');

    // test stirng
    readable_date = new Date();
    current_data = {
                dataType: 'guessData',
                dbname:'kiddraw',
                colname: version, 
                location: mode,
                trialNum: curTrial, // current trial in guessing session
                sessionId: sessionId, // each guesser
                recognizer_age: recognizer_age, // their age
                intended_category: intended_category, // inteded category of sketch
                producer_age: producer_age, // age of producer who made the sketch
                sketch_path: sketch_path, // which exact sketch recognizers are seeing
                clicked_category: clicked_category, // category that recognizers clicked 
                endTrialTime: Date.now(), // when trial was complete, e.g., now
                startTrialTime: startTrialTime, // when trial started, global variable
                date: readable_date,
            };

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

function restartExperiment() {
   
   var age = $('.active').attr('id'); // only active button from first page
   
   // send survey participation data
   var parent_guessed = document.getElementById("survey_parent").checked
   var child_guessed = document.getElementById("survey_child").checked
   var other_guessed = document.getElementById("survey_else").checked

   // only send if we actually saved any data
   if (curTrial>-1){
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
    }
    
    // send back to the landing page (not beginning of guessing game)
    window.location.href="https://stanford-cogsci.org:8881/landing_page.html"
}

function endExperiment(){
    $('#drawing').hide();
    $('#mainExp').hide();
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
    // document.ontouchmove = function(event){
    //     event.preventDefault();
    // }

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

    $('.allDone').bind('touchstart mousedown',function(e) {
        e.preventDefault()
        console.log('touched endExperiment  button');
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
    canvas.height = window.innerWidth*.70; // set to 80% of the actual screen
    canvas.width = canvas.height;


    // In general, refresh if no user activities in 90 seconds
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

    // randomize order that the buttons appear in for different runs of the game
    categories = ['bottle','lamp','cup','hat'] // small objects
    categories = shuffle(categories)
    categories.push('dont_know') // always at end becasuse in bottom row
    buttonList = []

    for(var j = 0; j < (categories.length); j++){
            this_category = categories[j]
            if (this_category=="dont_know"){
                category_text = "Don't know"
            }
            else {
                category_text = this_category
            }

            this_index = j+1
            this_button_image_index = "keepGoing" + "_" + this_index
            this_button_txt_index = "keepGoing" + "_" + this_index + "_" + "txt"
            
            // Push all of the relevant info into the stimuli list; requires videos and images to be named correctly!
            buttonList.push({"buttonIndex": this_button_image_index, "category": this_category, "image": "photocues/" + this_category + ".png"});
            document.getElementById(this_button_txt_index).innerHTML = category_text;
            document.getElementById(this_button_image_index).src = buttonList[j].image;
    }


    // LOAD SKETCH NAMES
    $.ajax({
        type: "GET",
        url: "balanced_sketch_paths.csv",
        dataType: "text",
        success: function(data) {
                results = Papa.parse(data); // parse csv file
                imgArray = new Array();
                for (i = 1; i < results.data.length; i++) {
                    var category = results.data[i][4];
                    var age = results.data[i][1];
                    var session_id = results.data[i][2];
                    var sketch_name= results.data[i][3]; //starts i at 1 to get rid of header 
                    var sketch_name_src = 'balanced_sketches_renamed/' + sketch_name
                    imgArray.push({
                        src: sketch_name_src,
                        category: category,
                        age: age
                    })
                }

                // SET UP TRIAL STRUCTURE
                sketch_categories = ['bottle','lamp','cup','hat']
                ages = ['age4','age5','age6','age7','age8']          
                stimListTest = []

                // function to get subset of sketches based on age/category
                function getSubset(this_category,this_age) {
                    return function(element) {
                        return (element.category == this_category &&
                                element.age == this_age)
                    }
                }


                // For each category / age group, select a random sketch and insert into trial structure
                for(var j = 0; j < (sketch_categories.length); j++){
                        this_sketch_category = sketch_categories[j]
                            for (var a = 0; a < (ages.length); a++){
                            this_age = ages[a] 
                            
                            // get subset of sketches for this age / category
                            sketch_subset = imgArray.filter(getSubset(this_sketch_category, this_age));
                            sketch_subset = shuffle(sketch_subset)
                            random_sketch_1 = sketch_subset[0].src; // take the first random sketch
                            random_sketch_2 = sketch_subset[1].src; // and the second

                            // Push all of the relevant info into the stimuli list; requires sketches to be named correctly...
                            stimListTest.push({"age": this_age, "category": this_sketch_category, "src": random_sketch_1});
                            stimListTest.push({"age": this_age, "category": this_sketch_category, "src": random_sketch_2});
                    }
                } 
                stimListTest = shuffle(stimListTest) // shuffle the order of the trials

                // Add in catch trials every 10 trials
                for(var j = 0; j < (sketch_categories.length); j++){
                        this_sketch_category = sketch_categories[j]
                            random_index = getRandomInt(1,4);
                            practice_trial_img = ['photos/' + this_sketch_category + "_" + random_index + ".png"];
                            prac_index = (j+1)*10 // every 10th trial
                            // Push all of the relevant info into the stimuli list; requires sketches to be named correctly...
                            stimListTest.splice(prac_index, 0, {"age": "photo", "category": this_sketch_category, "src": practice_trial_img});
                } 

                // Now also get the practice trials and put it at beginning
                sketch_categories = shuffle(sketch_categories) // shuffle sketch categories so in not same order every time
                for(var j = 0; j < (sketch_categories.length); j++){
                        this_sketch_category = sketch_categories[j]
                            random_index = getRandomInt(1,4);
                            practice_trial_img = ['photos/' + this_sketch_category + "_" + random_index + ".png"];
                            stimListTest.unshift({"age": "photo", "category": this_sketch_category, "src": practice_trial_img});
                } 

                // also add in introductory video trial
                intro = {"category":"intro", "video": "animalgame_intro.mp4","image":"images/lab_logo_stanford.png"}
                stimListTest.unshift(intro)

                ///// make this result of ajax function
                result = stimListTest;
            }, // success in ajax
                error: function() {
                    alert('ajax error occured');
                }
    }); // ajax
    
    // start with consent page
    $("#landingPage").hide();
    $('#parentEmail').val('');
    $('#email-form').show();
    $('#emailSent').hide();
    $(consentPage).fadeIn();
    // }


} // on document load





