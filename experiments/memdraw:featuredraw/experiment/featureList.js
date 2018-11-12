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

// add a new text box under the last one
function createTextBox() {
  	var form = document.getElementById("myForm");

  	// make sure no more than 20 text boxes
  	if (form.childNodes.length<45){
		var input = document.createElement("input");
		input.type = "text";
		input.style = "width:40%";
		var br = document.createElement("br");
		form.appendChild(br);
		form.appendChild(input);
		form.appendChild(br);
	}
	
}

// remove all text boxes except the first one
function deleteTextBoxes(){
	var form = document.getElementById("myForm");
	console.log(form.childNodes)
	console.log(form.childNodes.length)
	var length = form.childNodes.length
	var i = 4;
	for (i = length-1; i>5; i--){
		console.log(i)
		console.log(form.childNodes[i])
		form.removeChild(form.childNodes[i]);
	}
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
        var responses = []
        
        // log all responses from all text boxes
        var inputs = document.getElementsByTagName("input");
        for (i = 0; i<inputs.length-1;i++){
        	responses.push(inputs[i].value)
        }
        console.log(responses)

        // if there is something in the response, log it
        if (inputs && responses[0]) {
            response_logged = true;
            experiment.data.featureListed.push(responses);
            experiment.next();

            // clear all text box values
	        for (i = 0; i<inputs.length-1;i++){
	        	inputs[i].value = "";
	        }

	        deleteTextBoxes();
            
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
			var categoryName = trial_info.thisCategory;
			var prompt = "Think about what " +categoryName+"s look like. What makes a " 
			+categoryName+" look like a "+categoryName
			+ "? \nPlease list as many things you can think of in 30 seconds.";
			document.getElementById("featurePrompt").innerText = prompt;
            showSlide("featureListing"); //display slide
            experiment.data.category.push(trial_info.thisCategory);
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

