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

// shuffle function 
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

function shuffle_mult() {
    var length0 = 0,
        length = arguments.length,
        i,
        j,
        rnd,
        tmp;

    for (i = 0; i < length; i += 1) {
        if ({}.toString.call(arguments[i]) !== "[object Array]") {
            throw new TypeError("Argument is not an array.");
        }

        if (i === 0) {
            length0 = arguments[0].length;
        }

        if (length0 !== arguments[i].length) {
            throw new RangeError("Array lengths do not match.");
        }
    }


    for (i = 0; i < length0; i += 1) {
        rnd = Math.floor(Math.random() * i);
        for (j = 0; j < length; j += 1) {
            tmp = arguments[j][i];
            arguments[j][i] = arguments[j][rnd];
            arguments[j][rnd] = tmp;
        }
    }
}

// ######################## Configuration settings ############################

//set up item names
itemNames = ['a bear',
'a sheep',
'a camel',
'a tiger',
'a whale',
'a cow',
'an elephant',
'an octopus',
'a frog',
'a bee',
'a spider',
'a piano',
'a chair',
'a couch',
'a cactus',
'a bowl',
'a key',
'a phone',
'a pair of scissors',
'a bottle',
'a hat',
'a lamp',
'a watch',
'an apple',
'an ice cream cone',
'a clock',
'a mushroom',
'a bike',
'an airplane',
'a bird',
'a cat',
'a rabbit',
'a face',
'a hand',
'a horse',
'a person',
'a dog',
'a fish',
'a snail',
'a bed',
'a house',
'a tree',
'a cup',
'a book',
'a TV',
'a boat',
'a car',
'a train',
'a crab',
'a crocodile',
'a duck',
'a giraffe',
'a lion',
'a monkey',
'a panda',
'a truck']

itemNames=shuffle(itemNames);
var numTrialsExperiment = itemNames.length;



//set up uptake experiment slides.
var trials = [];

for (i = 0; i < itemNames.length; i++) {
    trial = {
        thisItemName: itemNames[i],
        slide: "commonlySeenRatings",
        trial_number: i+1,
    }
    trials.push(trial);
}


catchTrialTask = {
        thisItemName: "",
        slide: "catchTrialTask",
        trial_number: i+1,
    }

childAgeTrial = {
        thisItemName: "",
        slide: "children_qs",
        trial_number: i+2,
    }

trials.push(catchTrialTask);
trials.push(childAgeTrial);


// when the document loads
$(document).ready(function() {

    showSlide("instructions");
});


// ############################## The main event ##############################
var experiment = {

	// The object to be submitted.
	data: {
        trial_type:[],
		rating: [],
		itemName: [],
		ladder: [],
		age: [],
		education: [],
		comments: [],
		childsAge:[],
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

        // Array of radio buttons
        var radio = document.getElementsByName("judgment");
    
        // Loop through radio buttons
        for (i = 0; i < radio.length; i++) {
         if (radio[i].checked) {
            experiment.data.rating.push(radio[i].value);
            response_logged = true;         
        }
    }
    
        if (response_logged) {
            nextButton_FamRatings.blur();
            
            //  uncheck radio buttons
            for (i = 0; i < radio.length; i++) {
                radio[i].checked = false
            }

            experiment.next();

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
            console.log(trial_info)

			//If the current trial is undefined, call the end function.
			if (typeof trial_info == "undefined") {
				return experiment.debriefing();
			}

			// check which trial type you're in and display correct slide
			if (trial_info.slide == "commonlySeenRatings") {
                $("#itemInstructions").text("How often has your child seen " + trial_info.thisItemName + ' in real life?');
                showSlide("commonlyDrawnRatings"); //display slide
                experiment.data.itemName.push(trial_info.thisItemName);
	    	    }
            if (trial_info.slide == "children_qs") {
                showSlide("children_qs"); 
                }
            if (trial_info.slide == "catchTrialTask") {
                showSlide("catchTrialTask"); 
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

		experiment.data.ladder.push(document.getElementById("ladder").value);
		experiment.data.age.push(document.getElementById("age").value);
		experiment.data.education.push(document.getElementById("education").value);
		experiment.data.comments.push(document.getElementById("comments").value);
        experiment.data.childsAge.push(document.getElementById("childsAge").value);
		experiment.end();
	}
}


