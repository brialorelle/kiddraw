// ############################ Helper functions ##############################

// Shows slides. We're using jQuery here - the **$** is the jQuery selector function, which takes as input either a DOM element or a CSS selector string.
function showSlide(id) {
	// Hide all slides
	$(".slide").hide();
	// Show just the slide we want to show
	$("#"+id).show();
    $('#recognitionInput').focus();
}


// Get random integers.
// When called with no arguments, it returns either 0 or 1. When called with one argument, *a*, it returns a number in {*0, 1, ..., a-1*}. When called with two arguments, *a* and *b*, returns a random value in {*a*, *a + 1*, ... , *b*}.
function random(a,b) {
	if (typeof b == "undefined") {
		a = a || 2;
		return Math.floor(Math.random()*a);
	} else {
		return Math.floor(Math.random()*(b-a+1)) + a;
	}
}

// Add a random selection function to all arrays (e.g., <code>[4,8,7].random()</code> could return 4, 8, or 7). This is useful for condition randomization.
Array.prototype.random = function() {
  return this[random(this.length)];
}

// shuffle function - from stackoverflow?
// shuffle ordering of argument array -- are we missing a parenthesis?
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

// ######################## Experiment specific functinons ############################

$(document).ready(function() {

$.ajax({
    type: "GET",
    url: "recognition_rating_chunks/chunk_" + 3 + "photodraw2_srcd_recognition.csv",
    dataType: "text",
    success: function(data) {

            results = Papa.parse(data); // parse csv file

            //set up image arrays for both practice/catch trials 
            pracArray = new Array();
            chunk = 3;
            
            prac_categories = ['bird','dog','fish','rabbit'] 
            index=0
            for (i = 0; i < 3; i++){ // 3 exemplars for 4 categories = 12 validation trials

                for(j = 0; j < (prac_categories.length); j++){
                    this_prac_category = prac_categories[j]
                    var session_id= 'null'
                    var age = 'photo'
                    var category = this_prac_category;
                    var condition = 'practice'
                    var file_name = ['photos/' + this_prac_category + '_' + (i+1)  + '.png']
                    var photo_cue = 'null'
                    pracArray[index] = new Image();
                    pracArray[index].src = file_name;
                    pracArray[index].category = category;
                    pracArray[index].age = age;
                    pracArray[index].condition = condition;
                    pracArray[index].session_id = session_id;
                    pracArray[index].photo_cue = photo_cue;
                    pracArray[index].chunk = chunk;
                    index = index+1
                    }
            }

            // set up image arrays for
            imgArray = new Array();
            for (i = 0; i < results.data.length-2; i++) { // length -2 because of etra line, i+1 because of header
                var session_id= results.data[i+1][2]; 
                var age = results.data[i+1][4];
                var category = results.data[i+1][0];
                var condition = results.data[i+1][1];
                var file_name = results.data[i+1][5];
                var photo_cue = results.data[i+1][3];
                imgArray[i] = new Image();
                imgArray[i].src = file_name;
                imgArray[i].category = category;
                imgArray[i].age = age;
                imgArray[i].condition = condition;
                imgArray[i].session_id = session_id;
                imgArray[i].photo_cue = photo_cue;
                imgArray[i].chunk = chunk;
            }
            

            //First add 9 catch trials
            catchTrials = shuffle(pracArray.slice(3,12))
            imgArray = catchTrials.concat(imgArray)


            // // shuffle the imgArray so they appear in random order
            imgArray = shuffle(imgArray)

            // // then add in 4 training trials at the beginning
            trainingTrials = shuffle(pracArray.slice(0,3))
            imgArray = trainingTrials.concat(imgArray)
        
            // calculate total num trials
            numTrialsExperiment = results.data.length-2 + 12;  // -1 for the header, -1 for weird extra line, + 12 practice

            // set up uptake experiment slides.
            trials = [];
            for (i = 0; i < numTrialsExperiment; i++) {
            trial = {
                this_sketch_name: imgArray[i].src,
                this_sketch_category: imgArray[i].category,
                producer_age: imgArray[i].age,
                condition: imgArray[i].condition,
                drawing_session_id: imgArray[i].session_id,
                photo_cue: imgArray[i].photo_cue,
                chunk: imgArray[i].chunk,
                slide: "recognitionRatings",
                trial_number: i,
            }
            trials.push(trial);
            }
            
        }
     });
    
    // bind enter key to "next" button
    $(document).keypress(function(e){
        if (e.which == 13){
            experiment.log_response();
        }
    });


});
 


$(function() {
    availableTags = [
    "airplane",
    "boat",
    "train",
    "truck",

    "bike",
    "binoculars",
    "tractor",
    "glasses",

    "bird",
    "frog",
    "fish",
    "horse",

    "car",
    "dumbbell",
    "toilet",
    "dresser",

    "cat",
    "dog",
    "cow",
    "hedgehog",

    "rabbit",
    "camel",
    "whale",
    "duck",

    "chair",
    "couch",
    "radio",
    "television",

    "cup",
    "bottle",
    "vase",
    "bench",

    "hat",
    "computer",
    "table",
    "pillow",

    "house",
    "purse",
    "door",
    "bed",

    "tree",
    "feather",
    "lollipop",
    "microphone",

    "watch",
    "teapot",
    "guitar",
    "snail",

    "other/can't tell"

    ];
    $( "#recognitionInput" ).autocomplete({
        source: availableTags,
        change: function (event, ui) {
            if(!ui.item){
                $(event.target).val("");
            }
        }
    });
  });


// Show the instructions slide -- this is what we want subjects to see first.
showSlide("instructions");

// ############################## The main event ##############################
var experiment = {

	// The object to be submitted.
	data: {
        this_sketch_name: [],
        this_sketch_category: [],
        producer_age: [],
        condition: [],
        drawing_session_id: [],
        photo_cue: [],
        slide: [],
        trial_number: [],
        trial_type:[],
		rating: [],
        chunk: [],
        comments: [],
	},

	// end the experiment
	end: function() {
		showSlide("finished");
		setTimeout(function() {
			turk.submit(experiment.data)
		}, 1500);
	},


// LOG RESPONSE
    log_response: function() {

        var response_logged = false;

        // get input
        var input = document.getElementById("recognitionInput");
        var response = input.value;

        var valid_response = availableTags.includes(response)

        // if there is something in the response, log it
        if (input && response && valid_response) {
            response_logged = true;
            experiment.data.rating.push(response);
            experiment.next();
            $("#recognitionInput").val(""); // clear value
            $('#recognitionInput').data().autocomplete.term = null;
            $('#recognitionInput').focus();
            
        } else {
            $("#testMessage_att").html('<font color="red">' + 
            'Please select a response from the word bank.' + 
             '</font>');
            
        }
    },
	
	// The work horse of the sequence - what to do on every trial.
	next: function() {

		// Allow experiment to start if it's a turk worker OR if it's a test run
		if (window.self == window.top | turk.workerId.length > 0) {
		$("#testMessage_att").html(''); //clear test message
		$("#testMessage_uptake").html(''); 


		$("#progress").attr("style","width:" +
			 String(100 * (1 - (trials.length)/numTrialsExperiment)) + "%")
			// Get the current trial - <code>shift()</code> removes the first element
			// select from our scales array and stop exp after we've exhausted all the domains
		var trial_info = trials.shift();

		//If the current trial is undefined, call the end function.
		if (typeof trial_info == "undefined") {
			return experiment.debriefing();
		}

		// check which trial type you're in and display correct slide
		if (trial_info.slide == "recognitionRatings") {
            document.getElementById("imagePlaceholder").src = trial_info.this_sketch_name;
            showSlide("recognitionRatings"); //display slide
            

            // push all relevant data
            experiment.data.this_sketch_name.push(trial_info.this_sketch_name)
            experiment.data.this_sketch_category.push(trial_info.this_sketch_category)
            experiment.data.producer_age.push(trial_info.producer_age)
            experiment.data.condition.push(trial_info.condition)
            experiment.data.drawing_session_id.push(trial_info.drawing_session_id)
            experiment.data.photo_cue.push(trial_info.photo_cue)
            experiment.data.trial_number.push(trial_info.trial_number)
            experiment.data.chunk.push(trial_info.chunk)
    	    }
		
        experiment.data.trial_type.push(trial_info.slide);

        $('#recognitionInput').focus();
		}
	},

	//	go to debriefing slide
	debriefing: function() {
		showSlide("debriefing");
	},

// submitcomments function
	submit_comments: function() {
        experiment.data.comments.push(document.getElementById("comments").value);
		experiment.end();
	}
}


