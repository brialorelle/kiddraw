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

// ######################## Experiment specific functinons ############################

// function updateSlider(){
//     var slider = document.getElementById("quality");
//     var output = document.getElementById("slideVal");
//     output.innerHTML = slider.value;
// }

// for loading csv file full of image names
function processData(allText) {
    var allTextLines = allText.split(/\r\n|\n/);
    var headers = allTextLines[0].split(',');
    var lines = [];

    for (var i=1; i<allTextLines.length; i++) {
        var data = allTextLines[i].split(',');
        if (data.length == headers.length) {

            var tarr = [];
            for (var j=0; j<headers.length; j++) {
                tarr.push(headers[j]+":"+data[j]);
            }
            console.log(headers[j] + data[j])
            lines.push(tarr);
        }
    }
    // alert(lines);
}

$(document).ready(function() {

// when the slider gets input, change it
document.getElementById("compositionality").oninput = function() {
      var output = document.getElementById("slideVal");
      output.innerHTML = this.value;
    };

    $.ajax({
        type: "GET",
        url: "sketchNames.csv",
        dataType: "text",
        success: function(data) {
            results = Papa.parse(data);
            // alert(results);

            //set up image names
            imgArray = new Array();
            for (i = 1; i < results.data.length; i++) {
                var session_id= results.data[i][0]; //starts i at 1 to get rid of header
                var category = results.data[i][2];
                var age = results.data[i][3];
                imgArray[i] = new Image();
                imgArray[i].src = ['sketches/' + category + '/' +  category + '_sketch_' + age + '_' + session_id + '.png'];
                imgArray[i].category = category;
                imgArray[i].age = age;
            }
            numTrialsExperiment = results.data.length-1;    // -1 for the header  

            // set up uptake experiment slides.
            trials = [];
            for (i = 1; i < numTrialsExperiment+1; i++) {
            trial = {
                thisImageName: imgArray[i].src,
                thisImageCategory: imgArray[i].category,
                slide: "partsRatings",
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
		rating: [],
		imageName: [],
        comments: []
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
        var compositionality = document.getElementById("compositionality");
        var response = compositionality.value;

      if (response > 0) {
            response_logged = true;
            experiment.data.rating.push(response);
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

			//If the current trial is undefined, call the end function.
			if (typeof trial_info == "undefined") {
				return experiment.debriefing();
			}

			// check which trial type you're in and display correct slide
			if (trial_info.slide == "partsRatings") {
                // document.getElementById("drawingPrompt").innerHTML = "How good of a drawing of a " +  trial_info.thisImageCategory + " is this ?"
                document.getElementById("imagePlaceholder").src = trial_info.thisImageName;
                showSlide("partsRatingsSlide"); //display slide
                experiment.data.imageName.push(trial_info.thisImageName);
                
                // Slider reset for next trial
                var parts = document.getElementById("distinct_parts");
                parts.value = ""; // reset text box
                // updateSlider()
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


