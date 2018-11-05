// ############################ Helper functions ##############################

// Shows slides. We're using jQuery here - the **$** is the jQuery selector function, which takes as input either a DOM element or a CSS selector string.
function showSlide(id) {
	// Hide all slides
	$(".slide").hide();
	// Show just the slide we want to show
	$("#"+id).show();
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
    url: "featureList_categories.csv",
    dataType: "text",
    success: function(data) {
            results = Papa.parse(data); // parse csv file

            //set up image names
            cateArray = new Array();
            for (i = 1; i < results.data.length; i++) {
                var category= results.data[i][0]; //starts i at 1 to get rid of header
                cateArray[i].category = category;

            }
            numTrialsExperiment = results.data.length-1;    // -1 for the header  

            // set up uptake experiment slides.
            trials = [];
            for (i = 1; i < numTrialsExperiment+1; i++) {
            trial = {
                thisCategory: cateArray[i].category,
                slide: "featureListing",
                behavior: "",
                trial_number: i+1,
            }
            trials.push(trial);
            }
            trials=shuffle(trials);
        }
     });
});



// Show the instructions slide -- this is what we want subjects to see first.
showSlide("instructions");

// ############################## The main event ##############################
var experiment = {

	// The object to be submitted.
	data: {
        trial_type:[],
        category:[],
		featureListed: [],
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

        // Slider
        var input = document.getElementById("features");
        var response = input.value;

        // if there is something in the response, log it
        if (input && response) {
            response_logged = true;
            experiment.data.rating.push(response);
            experiment.next();
            $("#features").val(""); // clear value
            
        } else {
            $("#testMessage_att").html('<font color="red">' + 
            'Please make a response!' + 
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
			if (trial_info.slide == "featureListing") {
                showSlide("featureListing"); //display slide
                experiment.data.category.push(trial_info.thisCategory);
                experiment.data.featureListed.push(document.getElementById("features").value);
	    	    }
		experiment.data.trial_type.push(trial_info.slide);
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


