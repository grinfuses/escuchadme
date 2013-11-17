/**
 * @file
 * This file contains most of the code for the configuration page.
 */
 
// Create the drupal ShareThis object for clean code and namespacing:
var drupal_st = {
	// These are handlerd for updating the widget pic class.
	multiW: function() {
		jQuery(".st_widgetPic").addClass("st_multi");
	},
	classicW: function() {
		jQuery(".st_widgetPic").removeClass("st_multi");
	},
	// These are the handlers for updating the button pic class (stbc = sharethisbuttonclass).
	smallChicklet: function () {
		drupal_st.removeButtonClasses();
		jQuery("#stb_sprite").addClass("stbc_");
	},
	largeChicklet: function () {
		drupal_st.removeButtonClasses();
		jQuery("#stb_sprite").addClass("stbc_large");
	},
	hcount: function() {
		drupal_st.removeButtonClasses();
		jQuery("#stb_sprite").addClass("stbc_hcount");
	},
	vcount: function() {
		drupal_st.removeButtonClasses();
		jQuery("#stb_sprite").addClass("stbc_vcount");
	},
	button: function() {
		drupal_st.removeButtonClasses();
		jQuery("#stb_sprite").addClass("stbc_button");
	},
	// This is a helper function for updating button pictures.
	removeButtonClasses: function() {
		var toRemove = jQuery("#stb_sprite");
		toRemove.removeClass("stbc_");
		toRemove.removeClass("stbc_large");
		toRemove.removeClass("stbc_hcount");
		toRemove.removeClass("stbc_vcount");
		toRemove.removeClass("stbc_button");
	},
	//Write helper functions for saving:
	getWidget: function () {
		return jQuery(".st_widgetPic").hasClass("st_multiW") ? '5x': '4x';
	},
	getButtons: function () {
		var selectedButton = 'large';
		var buttonButtons = jQuery(".st_wIm");
		buttonButtons.each(function () {
			if (jQuery(this).hasClass("st_select")) {
				selectedButton = jQuery(this).attr("id").substring(3);
			}
		});
		console.log(selectedButton);
		return selectedButton;
	},
	setupServiceText: function () {
		jQuery("#edit-sharethis-service-option").css({display:"none"});
	},
	// Function to add various events to our html form elements
	addEvents: function() {
		jQuery("#edit-sharethis-widget-option-st-multi").click(drupal_st.multiW);
		jQuery("#edit-sharethis-widget-option-st-direct").click(drupal_st.classicW);
		
		jQuery("#edit-sharethis-button-option-stbc-").click(drupal_st.smallChicklet);
		jQuery("#edit-sharethis-button-option-stbc-large").click(drupal_st.largeChicklet);
		jQuery("#edit-sharethis-button-option-stbc-hcount").click(drupal_st.hcount);
		jQuery("#edit-sharethis-button-option-stbc-vcount").click(drupal_st.vcount);
		jQuery("#edit-sharethis-button-option-stbc-button").click(drupal_st.button);
		
		jQuery(".st_formButtonSave").click(drupal_st.updateOptions);
	},
	serviceCallback: function() {
		var services = stlib_picker.getServices("myPicker");
		var outputString = "";
		for(i=0;i<services.length;i++) {
			outputString += "\"" + _all_services[services[i]].title + ":"
			outputString += services[i] + "\","
		}
		outputString = outputString.substring(0, outputString.length-1);
		jQuery("#edit-sharethis-service-option").attr("value", outputString);
	}
};
//After the page is loaded, we want to add events to dynamically created elements.
jQuery(document).ready(drupal_st.addEvents);
//After it's all done, hide the text field for the service picker so that no one messes up the data.
jQuery(document).ready(drupal_st.setupServiceText);;
//This library requires JQuery
//It also requires stcommon.js in your header for an official list of services
//stlib_picker.defaultServices defines the services from stcommon that get loaded as the default services in the picker
//Styling can be found in stlib_picker.css and should be linked in the page.
//To get selected services as an array of strings:  (ie ["twitter", "sharethis", "facebook"] )
//   Call: var answer = stlib_picker.pickerList[uniqueID]["getServices"]();

var stlib_picker = {};
stlib_picker.pickerList = [];
stlib_picker.defaultServices = ["sharethis", "tumblr", "bebo"];
stlib_picker.getServices = function (id) {
	var func = stlib_picker.pickerList[id]["getServices"];
	return func();
}

//Creates the picker - make sure it has a unique ID
stlib_picker.setupPicker = function(jQElement, newDefaults, callback) {
	console.log("setting up picker");
	console.log(jQElement);
	//Make an array to store any needed options
	var optionsArray = [];
	optionsArray["El"] = jQElement;
	optionsArray["isSelect"] = false;
	optionsArray["getServices"] = function() {
		var answer = [];
		var lis = jQElement.children(".stp_pickerLeft").find(".stp_li");
		lis.each(function() {
			answer.push(jQuery(this).attr("id").substring(6));
		});
		return answer;
	};
	
	//Append the three divs that are needed:
	jQElement.append("<div class='stp_pickerLeft'><span class='stp_header'>Selected Service</span><ul class='stp_ulLeft'></ul></div>");
	jQElement.append("<div class='stp_pickerArrow'><div class='stp_arrow'><img class='stp_up' src='http://www.sharethis.com/images/Direction_Icons_Sprite.png'></img></div>" +
												  "<div class='stp_arrow'><img class='stp_left' src='http://www.sharethis.com/images/Direction_Icons_Sprite.png'></img></div>" +
												  "<div class='stp_arrow'><img class='stp_right' src='http://www.sharethis.com/images/Direction_Icons_Sprite.png'></img></div>" +
												  "<div class='stp_arrow'><img class='stp_down' src='http://www.sharethis.com/images/Direction_Icons_Sprite.png'></img></div>" +
					"</div>");
	jQElement.append("<div class='stp_pickerRight'><span class='stp_header'>Possible Services</span><ul class='stp_ulRight'></ul></div>");
	jQElement.append("<div class='stp_clear'></div>");
	
	//Add default Services
	var pickerDefaults = [];
	if (newDefaults) {
		pickerDefaults = newDefaults;
	} else {
		pickerDefaults = stlib_picker.defaultServices;
	}
	
	//Add all the services to the picker:
	jQuery.each(_all_services, function(key, value) {
		if(jQuery.inArray(key, pickerDefaults) == -1) {
			var ul = jQElement.children(".stp_pickerRight").children(".stp_ulRight");
			ul.append("<li id='st_li_" + key + "' class='stp_li'><img src='http://w.sharethis.com/images/"+key+"_32.png'></img><span class='stp_liText'>" + value.title + "</span></li>");
		}
	});
	for(i=0;i<pickerDefaults.length;i++) {
		var ul = jQElement.children(".stp_pickerLeft").children(".stp_ulLeft");
		ul.append("<li id='st_li_" + pickerDefaults[i] + "' class='stp_li'><img src='http://w.sharethis.com/images/"+pickerDefaults[i]+"_32.png'></img><span class='stp_liText'>" + _all_services[pickerDefaults[i]].title + "</span></li>");
	}
	
	//Add the various Event handlers 
	//Need to make sure that we don't get confused when there are multiple pickers
	jQElement.find(".stp_li").click(function() {
		jQElement.find(".stp_select").removeClass("stp_select");
		jQuery(this).addClass("stp_select");
		stlib_picker.pickerList[jQElement.attr("id")]["isSelect"] = true;
	});
	
	var arrowDiv = jQElement.children(".stp_pickerArrow").children(".stp_arrow");
	arrowDiv.children(".stp_up").click(function() {
		if (stlib_picker.pickerList[jQElement.attr("id")]["isSelect"]) {
			var li = jQElement.find(".stp_select");
			var prev = li.prev();
			if (prev.length != 0) {
				prev.before(li);
			}
			if (callback) {
				callback();
			}
		}
	});
	arrowDiv.children(".stp_left").click(function() {
		if (stlib_picker.pickerList[jQElement.attr("id")]["isSelect"]) {
			var li = jQElement.find(".stp_select");
			var ul = jQElement.children(".stp_pickerLeft").children(".stp_ulLeft");
			ul.prepend(li);
			if (callback) {
				callback();
			}
		}
	});
	arrowDiv.children(".stp_right").click(function() {
		if (stlib_picker.pickerList[jQElement.attr("id")]["isSelect"]) {
			var li = jQElement.find(".stp_select");
			var ul = jQElement.children(".stp_pickerRight").children(".stp_ulRight");
			ul.prepend(li);
			if (callback) {
				callback();
			}
		}
	});
	arrowDiv.children(".stp_down").click(function() {
		if (stlib_picker.pickerList[jQElement.attr("id")]["isSelect"]) {
			var li = jQElement.find(".stp_select");
			var next = li.next();
			if (next.length != 0) {
				next.after(li);
			}
			if (callback) {
				callback();
			}
		}
	});
		
	//Save the options (and the picker) globally
	stlib_picker.pickerList[jQElement.attr("id")] = optionsArray;
};
