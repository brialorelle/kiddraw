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

var textBoxCounter = 3

// add a new text box under the last one
function createTextBox() {
  	var form = document.getElementById("myForm");

  	// make sure no more than 20 text boxes
  	if (textBoxCounter<20){
		var input = document.createElement("input");

        textBoxCounter++;
        input.setAttribute('id','box'+textBoxCounter)
        input.setAttribute('type','text')
        input.setAttribute('style','width:16%')
        input.setAttribute('class','userResponse')
        input.setAttribute('maxlength',30)
        input.setAttribute('onchange','validateResponse()')

		var br = document.createElement("p");
		form.appendChild(br);
		form.appendChild(input);

        // var newTextBoxDiv = $(document.createElement('div')).attr("id",id);
        // newTextBoxDiv.after().html('<input type="text" id='+id+
        //     ' style="width:16%" value="" class = "userResponse" maxlength=30')
        // // newTextBoxDiv.appendTo("#textBoxesGroup")
        // form.appendChild(newTextBoxDiv);

	}
	
}

// remove all text boxes except the first one
function deleteTextBoxes(){
	var counter = 0;
	for (var i = textBoxCounter; i>3;i--){
		$("#box"+i).remove();
	}
}

// remove the last text box
function removeLastTextBox(){
	if (textBoxCounter > 3){
		$("#box"+textBoxCounter).remove();
		textBoxCounter--;
	}


}

var cateCountForValidRes = 0;
var cateListForValidRes = [];
//validate response
//modified from stack overflow
//https://stackoverflow.com/questions/44504541/check-for-duplicate-values-in-html-input-textboxes-and-paint-the-borders-red-not
function validateResponse() {
    var values = [];  //Create array where we'll store values

    $(".duplicate").removeClass("duplicate"); //Clear all duplicates
    $(".containCue").removeClass("containCue"); //Clear all containCues
    var $inputs = $('input[class="userResponse"]'); //Store all inputs 

    
    $inputs.each(function() {   //Loop through the inputs
    
        var v = this.value;
        if (!v) return true; //If no value, skip this input
        
        //If this value is a duplicate, get all inputs from our list that
        //have this value, and mark them ALL as duplicates
        if (values.includes(v)) $inputs.filter(function() { return this.value == v }).addClass("duplicate");
        values.push(v); //Add the value to our array
    });


    //check every response, if contains the cue, label it as containCue
    $inputs.filter(function() { 
        var stringArray = this.value.split(" ");
        return stringArray.includes(cateListForValidRes[cateCountForValidRes])
                                }).addClass("containCue");

    return $(".duplicate").length > 0;

}



// ######################## Experiment specific functinons ############################

$(document).ready(function() {

        // categories = ['car', 'bike', 'train', 'airplane', 'cup', 'chair', 'key', 'scissors', 'couch',
        // 'dog', 'sheep', 'fish', 'rabbit', 'cat', 'bird', 'frog', 'bear', 'person']
        categories =['car','bike','train', 'airplane']
        categories = shuffle(categories);
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

        
  
        for (i = 0; i < numTrialsExperiment; i++){
            cateListForValidRes.push(trials[i].thisCategory);
        }

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

        // check for empty responses
        var noEmptyResponses = true;
        for (i = 0; i<responses.length;i++){
        	if(responses[i]=="")
        	{
        		noEmptyResponses=false
        	}
        }

        var duplicate = ($(".duplicate").length >0) 

        var containCue = ($(".containCue").length >0) 

        // if there is something in the response, log it
        if (inputs && noEmptyResponses && !duplicate && !containCue) {
            response_logged = true;
            experiment.data.featureListed.push(responses);
            experiment.next();

            // clear all text box values
	        for (i = 0; i<inputs.length-1;i++){
	        	inputs[i].value = "";
	        }

            // clear the duplicates and containCues
	        $(".duplicate").removeClass("duplicate");
            $(".containCue").removeClass("containCue");

            // remove all text boxes execpt the first three
	        deleteTextBoxes();

            // increment the category count for validating responses
            cateCountForValidRes++;

            
        } else {
            var warning = 'Please make a response.'
        	if (duplicate)
        	{
                warning = 'Please do not enter duplicate responses.' 
        	}
            else if(containCue)
            {
                warning = 'Please do not include the name of the object in your response.'
            }
        	$("#testMessage_att").html('<font color="red">' + 
                        warning + 
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
			+ "?\nPlease list three or more features, and list each feature in a new text box.";
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

