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

        categories = ['cat','rabbit', 'car','bicycle']
        // set up uptake experiment slides.
        trials = [];
        numTrialsExperiment=categories.length
        for (i = 0; i < numTrialsExperiment; i++) {
            trial = {
                thisCategory: categories[i],
                slide: "featureListing",
                behavior: "",
                trial_number: i+1,
            }
            trials.push(trial);
        }
        trials=shuffle(trials);

	// for time progress bar
	timeLimit=10;
	clickedSubmit=0; // define global variable
	nextCount=0

	// when page loads, bind this functino
	$('#nextTrialButton').bind('touchstart mousedown',function (e) {
		e.preventDefault()
		if (isDoubleClicked($(this))){
			console.log('double clicked')
			return;	
		} 
			else {
			console.log('not double clicked')
			experiment.log_response();
		}
	});

});


function monitorProgress(){
    	clickedSubmit=0;
	    console.log('starting monitoring')
		$('.progress-bar').attr('aria-valuemax',timeLimit);
		$('.progress').show(); // don't show progress bar until we start monitorung
	    progress(timeLimit, timeLimit, $('.progress')); // this is actually the wrapped div around the bar that has a certain, stable width
	};

function progress(timeleft, timetotal, $element) {
    // get current and total widths; log them
    var totalBarWidth = $element.width(); // this should never change
    var progressBarWidth = ((timeleft/timetotal) * $element.width())
    console.log("progressBarWidth = "+progressBarWidth + " totalBarWidth = "+totalBarWidth +  " timeleft=" + timeleft)
    
    // set value
    $('.progress-bar').attr("aria-valuenow", timeleft).text(timeleft)
    // change width

    // $('.progress-bar').animate({ width: progressBarWidth }, timeleft == timetotal ? 0 : 1000, "linear");
    $('.progress-bar').animate({ width: progressBarWidth });

    

    if(timeleft > 0 & clickedSubmit==0) {
        setTimeout(function() {
            progress(timeleft - 1, timetotal, $element);
        }, 1000);
    }
    else if(timeleft == 0 & clickedSubmit==0){
        console.log("trial timed out")
        clickedSubmit=1 // as if we clicked submit
        $('.progress-bar').width = totalBarWidth
        experiment.log_response()
    }
    else if (clickedSubmit==1){
        console.log("clicked next; exiting out of progress function")
        $('.progress-bar').width = totalBarWidth
    }
};





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
    console.log('checked double')
}



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

        var input = document.getElementById("features");
        var response = input.value;

        // if there is something in the response, log it
        if (input && response) {
            response_logged = true;
            experiment.data.featureListed.push(response);
            experiment.next();
            $("#features").val(""); // clear value
            
        } else {
            $("#testMessage_att").html('<font color="red">' + 
            'Please make a response!' + 
             '</font>');
            
        }
        response_logged = true;
        experiment.data.featureListed.push(response);
        experiment.next();
    },

	

	// The work horse of the sequence - what to do on every trial.
	next: function() {
    	nextCount=nextCount+1
    	clickedSubmit=1  // Need to say that we clicked the next button
    	console.log("clickedSubmit = " + clickedSubmit)
    	console.log("nextCount = " + nextCount)
		$('.progress').hide(); 

		// Allow experiment to start if it's a turk worker OR if it's a test run
		if (window.self == window.top | turk.workerId.length > 0) {
		$("#testMessage_att").html(''); //clear test message
		$("#testMessage_uptake").html(''); 


		$("#task-progress").attr("style","width:" +
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
			// push data
			experiment.data.category.push(trial_info.thisCategory);
			// set up experiment slide
			var categoryName = trial_info.thisCategory;
			var prompt = "Think about what " +categoryName+"s look like. What makes a " 
			+categoryName+" look like a "+categoryName
			+ "? \nPlease list as many things you can think of in 30 seconds.";
			
			document.getElementById("featurePrompt").innerText = prompt;
          	
          	// reset bar width just in case
          	totalBarWidth=$('.progress').width()
	        $('.progress-bar').width(totalBarWidth)

          	// wait 1 second before changing cue  
	        setTimeout(function() {

	            showSlide("featureListing"); //display slide
	            monitorProgress();
	        }, 1000);
            
    	  
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


