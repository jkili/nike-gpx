/**
 * Nike+ Exporter
 * (c) jkili 2012,2013
 */
var email, screenName, userId, profileId, firstName, lastName, imageUrl;
var loggedIn;
var VERSION_MAJOR = "1";
var VERSION_MINOR = "46";
var invert = false;

$(document).ready(function() {
	$("#login-button").bind('click', login);
	$("#logout-button").bind('click', logout);

	$("#email").val($.cookie("email"));

	if ($.cookie("userId")) {
		getLoginDetailsFromCookies();
		initScreen();
	} else {
	}
	updateSM("Initialised");
});

var req = new XMLHttpRequest();
get_blob_builder = function() {
	return window.BlobBuilder || window.WebKitBlobBuilder
			|| window.MozBlobBuilder;
}

function updateSM(txt) {
	$("#status-message").html(txt);
	console.log(txt);
}

function login() {

	updateSM("Logging In... ");
	$("#login-failed").css('display', 'none');
	email = $("#email").val();
	pw = $("#password").val();
	req.open("POST",
			"https://secure-nikeplus.nike.com/nsl/services/user/login?"
					+ "app=b31990e7-8583-4251-808f-9dc67b40f5d2&"
					+ "format=json&contentType=plaintext", true);
	var params = "email=" + encodeURI(email) + "&password=" + encodeURI(pw);
	req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	req.setRequestHeader("Content-length", params.length);
	req.setRequestHeader("Connection", "close");

	req.onload = loginComplete;
	req.send(params);
	updateSM("Req sent. Waiting...");
	$("#loading").css('display', '');
	$("#login-button").attr('disabled', 'true');
}
function logout() {
	var cookies = document.cookie.split(";");
	for ( var i = 0; i < cookies.length; i++) {
		cookies[i] = jQuery.trim(cookies[i]);
		var equals = cookies[i].indexOf("="), name = equals > -1 ? cookies[i]
				.substr(0, equals) : cookies[i];
		if (name != "email") {
			$.removeCookie(name);
			updateSM("Removed cookie: " + name);
		}
	}
	window.location.reload(true);
}

function getLoginDetailsFromCookies() {
	userId = $.cookie("userId");
	screenName = $.cookie("screenName");
	firstName = $.cookie("firstName");
	lastName = $.cookie("lastName");
	profileId = $.cookie("profileId");
	imageUrl = $.cookie("imageUrl");
}
function saveLoginDetailsToCookies() {
	$.cookie("email", email);
	$.cookie("userId", userId);
	$.cookie("screenName", screenName);
	$.cookie("firstName", firstName);
	$.cookie("lastName", lastName);
	$.cookie("profileId", profileId);
	$.cookie("imageUrl", imageUrl);
}

function initScreen() {
	document.getElementById("login-button").style.display = "none";
	document.getElementById("login-form").style.display = "none";
	document.getElementById("logged-in-ind").style.display = "";
	document.getElementById("logged-in-ind").className = "logged-in-ind";
	document.getElementById("user").innerHTML = firstName + " " + lastName + "(" + screenName + ")";
	//document.getElementById("user-image").src = imageUrl;
	//document.getElementById("user-image").style.display = "";
	getActivities();
}

function loginComplete() {
	
	$("#loading").css('display', 'none');
	updateSM("Response: " + req.responseText);
	var json = JSON.parse(req.responseText, null);
	json = json.serviceResponse;
	if (json.header.success == "true") {
		userId = json.body.User.id;
		screenName = json.body.User.screenName;
		firstName = json.body.User.firstName;
		lastName = json.body.User.lastName;
		profileId = json.body.User.profileId;
		imageUrl = json.body.User.imageUrl;
		saveLoginDetailsToCookies();
		initScreen();
	} else {
	        updateSM("Login Failed");
		$("#login-failed").css('display', '');
		$("#login-button").removeAttr('disabled');
	}
}

function getActivities() {
	screenNameSanitised = screenName;
	if(typeof(screenName) == "undefined") {
		throw "Screen Name not Set"; 
	}
	if (screenName.indexOf(' ') == 0) { 
		screenNameSanitised = screenName.replace(/\s/g, "");
		screenNameSanitised = screenNameSanitised.toLowerCase();
	} 	

	url =  "http://nikeplus.nike.com/plus/activity/running/"
			+ encodeURI(screenNameSanitised) + "/lifetime/activities?indexStart=0&indexEnd=1000";
	req.open("GET", url, true);
	updateSM("Activities URL: " + url); 
	req.onload = handleActivitiesLoad;
	
	$("#loading-table").css('display', '');

	updateSM("Getting activities...");
	req.send(null);
}

var startIndex = 0;
var perPage = 5;
var totalRows = 0;
var activities;

function handleActivitiesLoad() {
	
	try {
		updateSM("handleActivitiesLoad Response: " + req.responseText);
		$("#activity-table-row").css('display', '');
		
	var json = JSON.parse(req.responseText, null);
	activities = json.activities;
	if(typeof(activities) == "undefined") {
		$("#loading-table").css('display', 'none');
		$("#alert-error-message").html("No activities found. JSON: " + req.responseText);
		$("#alert-error").css('display', '');
		updateSM("No activities found. JSON: " + req.responseText);
		return;
	}
	
	totalRows = activities.length;
	
	activities.reverse();
	
	$("#pager").pagination(totalRows, {
		items_per_page : perPage,
		callback : loadContents
	});
	
	}
	catch(err){
		$("#loading-table").css('display', 'none');
		if(err.type == "code_gen_from_strings") {
			// it was not JSON
			$("#alert-error-message").html("Sorry, your activities can not be loaded at present. Please logout and try again.");
		} else {
			$("#alert-error-message").html("An error occurred while loading activities. Details: [" + err + "].");
		}
		
		$("#alert-error").css('display', '');
		updateSM("Error Occurred:" + err);
		updateSM(err.stack);
	}
}

/** Load Contents of a particular page. */
function loadContents(page_index, jq) {
	addRows(page_index - 1);
}

function addRows(page) {
	
	var tableBody = document.getElementById("activity-table-body");
	$("#activity-table-body tr").remove();
	
	startIndex = (page + 1) * perPage;
	updateSM("start Index" + startIndex + ", page: " + page + ", per: "
			+ perPage);
	for (i = startIndex; i < startIndex + perPage; i++) {
		if(typeof(activities[i]) != "undefined"){
		var row = document.createElement("tr");
		//var colIND = document.createElement("td");
		var col1 = document.createElement("td");
		var col2 = document.createElement("td");
		var col3 = document.createElement("td");
		var col4 = document.createElement("td");
		var col5 = document.createElement("td");
		var col6 = document.createElement("td");
		
		row.appendChild(col1);
		row.appendChild(col2);
		row.appendChild(col3);
		row.appendChild(col4);
		row.appendChild(col5);
		//row.appendChild(colIND);
		row.appendChild(col6);
		tableBody.appendChild(row);
		col1.innerHTML = activities[i].activity.startTimeUtc;
		col2.innerHTML = activities[i].activity.name;
		col3.innerHTML = (activities[i].activity.metrics.duration/1000/60).toFixed(2) + " mins";
		col4.innerHTML = activities[i].activity.metrics.distance.toFixed(2) + "km";
		if(typeof(activities[i].activity.tags.note) !== "undefined") {
			col5.innerHTML = activities[i].activity.tags.note;
		}
		
		if(activities[i].activity.gps) {
			var downloadLink = document.createElement("div");
			
			var link = document.createElement("a");
			link.className = "btn btn-info btn-xs";
			col6.appendChild(link);
			link.appendChild(downloadLink);
			link.addEventListener('click', getActivity);
			link.id = "gpx-" + activities[i].activity.activityId;
			link.innerHTML="GPX";
		
			var globe = document.createElement("i");
			col2.appendChild(globe);
			globe.setAttribute("class","icon-globe");
		}
		
		var tcxDownloadLink = document.createElement("div");
		var tcxlink = document.createElement("a");
		tcxlink.className = "btn btn-primary btn-xs";
		col6.appendChild(tcxlink);
		tcxlink.appendChild(tcxDownloadLink);
		tcxlink.addEventListener('click', getActivity);
		tcxlink.id = "tcx-" + activities[i].activity.activityId;
		tcxlink.innerHTML="TCX";
		
		if(activities[i].activity.heartrate) {
			var hr = document.createElement("i");
			col2.appendChild(hr);
			hr.setAttribute("class","icon-heart");
		}
		
		}
	}
	
	$("#loading-table").css('display', 'none');
	
}

function getActivity(e) {
	var id = e.target.id.substring(4);
	var type = e.target.id.substring(0,3);
	if (id.length == 0) {
		id = e.currentTarget.id.substring(4);
	    type = e.currentTarget.id.substring(0,3);
	}
	updateSM("Getting activity: " + id + "...");
	req.open("GET", "http://nikeplus.nike.com/plus/running/ajax/" + encodeURI(id), true);
	updateSM("D/L type: " + type);
	
	if(type == "tcx") 
		req.onload = handleActivityLoadTCX;
	else
		req.onload = handleActivityLoadGPX;
	
	req.send(null);
}

function handleActivityLoadGPX() {
	
	updateSM("handleActivityLoad Response: " + req.responseText);
	try{
	var json = JSON.parse(req.responseText, null);
	json = json.activity;
	createGPX(json);
	}
	catch(err){
		$("#alert-error").css('display', '');
		$("#alert-error-message").html("An error occurred while creating GPX file. Details: [" + err + "]");
	}
}

function handleActivityLoadTCX() {
	
	updateSM("handleActivityLoad Response: " + req.responseText);
	try{
	var json = JSON.parse(req.responseText, null);
	json = json.activity;
	createTCX(json);
	}
	catch(err){
		$("#alert-error").css('display', '');
		$("#alert-error-message").html("An error occurred while creating TCX file. Details: [" + err + "]");
	}
}

function createTCX(data) {
	processSplits(data);
	
	// XML
	var doc = document.implementation.createDocument(
			"http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2", "TrainingCenterDatabase", null);
	doc.documentElement
			.setAttribute(
					"xsi:schemaLocation",
					"http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd");
	doc.documentElement.setAttribute("xmlns:xsi",
			"http://www.w3.org/2001/XMLSchema-instance");
	doc.documentElement.setAttribute("xmlns:ns5",
			"http://www.garmin.com/xmlschemas/ActivityGoals/v1");
	doc.documentElement.setAttribute("xmlns:ns4",
			"http://www.garmin.com/xmlschemas/ProfileExtension/v1");
	doc.documentElement.setAttribute("xmlns:ns3",
			"http://www.garmin.com/xmlschemas/ActivityExtension/v2");
	doc.documentElement.setAttribute("xmlns:ns2",
			"http://www.garmin.com/xmlschemas/UserProfile/v2");	
	doc.documentElement.setAttribute("xmlns",
			"http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2");				

	// Meta Data
	var activities = doc.createElement("Activities");
	doc.documentElement.appendChild(activities);
	
	var activity = doc.createElement("Activity");
	if(data.activityType == "RUN") {
		activity.setAttribute("Sport", "Running");	
	} else if(data.activityType == "RIDE" || data.activityType[0] == "B") { 
		activity.setAttribute("Sport", "Biking"); // Or "Other" .check.
	} else {
		 activity.setAttribute("Sport", "Biking"); // Or "Other" .check.
	}
	activities.appendChild(activity);

	var id = doc.createElement("Id");
	id.appendChild(doc.createTextNode(data.startTimeUtc));
	activity.appendChild(id);
	
	var lap = doc.createElement("Lap");
	activity.appendChild(lap);
	lap.setAttribute("StartTime", data.startTimeUtc);
	
	var tts = doc.createElement("TotalTimeSeconds");
	tts.appendChild(doc.createTextNode((data.duration/1000).toFixed(1)));
	lap.appendChild(tts);	
	
	var dm = doc.createElement("DistanceMeters");
	dm.appendChild(doc.createTextNode((data.distance * 1000).toFixed(1)));
	lap.appendChild(dm);	
	
	/*var mspeed = doc.createElement("MaximumSpeed");
	mspeed.appendChild(doc.createTextNode(data.distance * 1000));
	lap.appendChild(mspeed);*/
	
	var cal = doc.createElement("Calories");
	cal.appendChild(doc.createTextNode(data.calories));
	lap.appendChild(cal);
	var intensity = doc.createElement("Intensity");
	intensity.appendChild(doc.createTextNode("Active"));
	lap.appendChild(intensity);
	var triggerMethod = doc.createElement("TriggerMethod");
	triggerMethod.appendChild(doc.createTextNode("Manual"));
	lap.appendChild(triggerMethod);
	
	var track = doc.createElement("Track");
	lap.appendChild(track);
	
	
	if(typeof (data.geo) == "undefined" || typeof(data.geo.waypoints) == "undefined") {
		updateSM("No geo or waypoints (i.e. no GPS coords). Not adding track points to TCX file.");
	} else {
		if(data.heartrate) {
			findHeartRateData(data);
		}
		for (i = 0; i < data.geo.waypoints.length; i++) {
			appendTCXTrackPoint(doc, track, data.geo.waypoints[i], "Trackpoint");
		}
	}
	
	if(typeof(data.tags.note) !== "undefined") {
		var notes = doc.createElement("Notes");
		notes.appendChild(doc.createTextNode(data.tags.note + " #nike+("+data.activityId+")"));
		activity.appendChild(notes);
	} 
	
	// Creator
	var creator = doc.createElement("Creator");
	activity.appendChild(creator);
	creator.setAttribute("xsi:type", "Device_t");
	var creatorName = doc.createElement("Name");
	creator.appendChild(creatorName);
	creatorName.appendChild(doc.createTextNode(data.deviceType));
	
	var unitId = doc.createElement("UnitId");
	unitId.appendChild(doc.createTextNode("0"));
	creator.appendChild(unitId);
	var prodId = doc.createElement("ProductID");
	prodId.appendChild(doc.createTextNode("1"));
	creator.appendChild(prodId);
	
	var verC = doc.createElement("Version");
	creator.appendChild(verC);
	var vermaj = doc.createElement("VersionMajor");
	vermaj.appendChild(doc.createTextNode("1"));
	verC.appendChild(vermaj);
	var vermin = doc.createElement("VersionMinor");
	vermin.appendChild(doc.createTextNode("4"));
	verC.appendChild(vermin);
	var buildmaj = doc.createElement("BuildMajor");
	buildmaj.appendChild(doc.createTextNode("0"));
	verC.appendChild(buildmaj);
	var buildmin = doc.createElement("BuildMinor");
	buildmin.appendChild(doc.createTextNode("0"));
	verC.appendChild(buildmin);
	
	
	
	// Author
	var author = doc.createElement("Author");
	doc.documentElement.appendChild(author);
	author.setAttribute("xsi:type", "Application_t");
	var authorName = doc.createElement("Name");
	author.appendChild(authorName);
	authorName.appendChild(doc.createTextNode("Nike Exporter"));
	var build = doc.createElement("Build");
	author.appendChild(build);
	var ver = doc.createElement("Version");
	build.appendChild(ver);
	var vermaj = doc.createElement("VersionMajor");
	vermaj.appendChild(doc.createTextNode(VERSION_MAJOR));
	ver.appendChild(vermaj);
	var vermin = doc.createElement("VersionMinor");
	vermin.appendChild(doc.createTextNode(VERSION_MINOR));
	ver.appendChild(vermin);
	
	var buildmaj = doc.createElement("BuildMajor");
	buildmaj.appendChild(doc.createTextNode("0"));
	ver.appendChild(buildmaj);
	var buildmin = doc.createElement("BuildMinor");
	buildmin.appendChild(doc.createTextNode("0"));
	ver.appendChild(buildmin);

	var lang = doc.createElement("LangID");
	lang.appendChild(doc.createTextNode("en"));
	author.appendChild(lang);
	var part = doc.createElement("PartNumber");
	part.appendChild(doc.createTextNode("006-D2449-00"));
	author.appendChild(part);
	
	// Save File
	var xml = xml2Str(doc.documentElement);
	updateSM("TCX File: " + xml);

	var parts = ['<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n',xml];
	var blob = new Blob(parts, {type : 'text/plain'});
	var fileName = data.activityId + ".tcx";
	saveAs(blob, fileName);
	updateSM("SaveAs complete");

	// Alert
	$("#alert").css('display', '');
	$("#alert-message").html("Saved file '" + fileName + "'. Please check in your 'Downloads' folder");
}

function createGPX(data) {
	processSplits(data);

	// XML
	var doc = document.implementation.createDocument(
			"http://www.topografix.com/GPX/1/1", "gpx", null);
	doc.documentElement
			.setAttribute(
					"xsi:schemaLocation",
					"http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd");
	doc.documentElement.setAttribute("version", "1.1");
	doc.documentElement.setAttribute("creator", "NikePlus GPX Bridge");
	doc.documentElement.setAttribute("xmlns:xsi",
			"http://www.w3.org/2001/XMLSchema-instance");
	doc.documentElement.setAttribute("xmlns:gpxtpx",
			"http://www.garmin.com/xmlschemas/TrackPointExtension/v1");
	doc.documentElement.setAttribute("xmlns:gpxx",
			"http://www.garmin.com/xmlschemas/GpxExtensions/v3");

	// Meta Data
	var metadata = doc.createElement("metadata");
	doc.documentElement.appendChild(metadata);

	var name = doc.createElement("name");
	var desc = doc.createElement("desc");
	var author = doc.createElement("author");
	var username = doc.createElement("name");
	var time = doc.createElement("time");
	author.appendChild(username);
	username.appendChild(doc.createTextNode(firstName + " " + lastName));
	metadata.appendChild(name);
	metadata.appendChild(author);
	metadata.appendChild(time);
	name.appendChild(doc.createTextNode(data.name));
	metadata.appendChild(desc);
	if(typeof(data.tags.note) !== "undefined") {
		desc.appendChild(doc.createTextNode(data.tags.note + " #nike+"));
	} else {
		desc.appendChild(doc.createTextNode(data.name + " #nike+"));
	}
		
	time.appendChild(doc.createTextNode(data.startTimeUtc));

	// Bounds
	if(typeof (data.geo) == "undefined" || typeof(data.geo.waypoints) == "undefined") {
		updateSM("No geo or waypoints (i.e. no GPS coords). Setting bounds.");
	} 
	else {
	var minLon = 10000;
	var maxLon = -10000;
	var minLat = 10000;
	var maxLat = -10000;

	for (wp in data.geo.waypoints) {
		if (data.geo.waypoints[wp].lon > maxLon)
			maxLon = data.geo.waypoints[wp].lon;
		if (data.geo.waypoints[wp].lon < minLon)
			minLon = data.geo.waypoints[wp].lon;
		if (data.geo.waypoints[wp].lat > maxLat)
			maxLat = data.geo.waypoints[wp].lat;
		if (data.geo.waypoints[wp].lat < minLat)
			minLat = data.geo.waypoints[wp].lat;
	}
	var bounds = doc.createElement("bounds");
	bounds.setAttribute("maxlon", maxLon);
	bounds.setAttribute("maxlat", maxLat);
	bounds.setAttribute("minlon", minLon);
	bounds.setAttribute("minlat", minLat);
	metadata.appendChild(bounds);
	}
	
	// Trk
	var trk = doc.createElement("trk");
	doc.documentElement.appendChild(trk);
	var trkType = doc.createElement("type");
	trk.appendChild(trkType);
	trkType.appendChild(doc.createTextNode("run"));
	var seg = doc.createElement("trkseg");
	trk.appendChild(seg);

	if(typeof (data.geo) == "undefined" || typeof(data.geo.waypoints) == "undefined") {
		updateSM("No geo or waypoints (i.e. no GPS coords). Not adding track points to GPX file.");
	} else {
		if(data.heartrate) {
			findHeartRateData(data);
		}
		for (i = 0; i < data.geo.waypoints.length; i++) {
			appendTrkpt(doc, seg, data.geo.waypoints[i]);
		}
	}

	// Save File
	var xml = xml2Str(doc.documentElement);
	updateSM("GPX File: " + xml);
	var parts = ['<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n',xml];
	var blob = new Blob(parts, {type : 'text/plain'});
	var fileName = data.activityId + ".gpx";
	saveAs(blob, fileName);
	updateSM("SaveAs complete");

	// Alert
	$("#alert").css('display', '');
	$("#alert-message").html("Saved file '" + fileName + "'. Please check in your 'Downloads' folder");
}

function findHeartRateData(data) {
	if(!data.gps){
		// no point without gps data!
		return;
	}
	for(i = 0; i < data.history.length; i++) {
		if(data.history[i].type == "HEARTRATE") {
			// found it
			appendHeartRateData(data, data.history[i].values)
			break;
		}
	}
}

function appendHeartRateData(data, values) {
	try{
	// Add heart rate data to every 10th
	hr_idx = 0;
	for(i = 0; i < data.geo.waypoints.length; i=i+10) {
		// Only if not already present (from splits potentially)
		if(typeof(data.geo.waypoints[i].hr) == "undefined") {
			data.geo.waypoints[i].hr = values[hr_idx];
		}
		hr_idx++;
	}
	}catch(err){
		updateSM("Error occurred placing HR data on waypoints: " + err);
	}
}



function appendTrkpt(doc, seg, point) {
	appendPt(doc, seg, point, "trkpt");
}

/**
 * Append TrackPoint
 */
function appendPt(doc, seg, point, name) {
	var trkpt = doc.createElement(name);
	seg.appendChild(trkpt);

	trkpt.setAttribute("lat", point.lat);
	trkpt.setAttribute("lon", point.lon);

	var ele = doc.createElement("ele");
	trkpt.appendChild(ele);
	ele.appendChild(doc.createTextNode(point.ele));

	if (typeof (point.time) !== "undefined") {
		var time = doc.createElement("time");
		trkpt.appendChild(time);
		time.appendChild(doc.createTextNode(point.time));
	}
	
	if (typeof (point.hr) !== "undefined" && point.hr != 0) {
		var extension = doc.createElement("extensions");
		var tpext = doc.createElement("gpxtpx:TrackPointExtension");
		var hr = doc.createElement("gpxtpx:hr");
		extension.appendChild(tpext);
		tpext.appendChild(hr);
		hr.appendChild(doc.createTextNode(point.hr));
		trkpt.appendChild(extension);
	}
}

/**
 * Append TrackPoint
 */
function appendTCXTrackPoint(doc, seg, point, name) {
	var trkpt = doc.createElement(name);
	seg.appendChild(trkpt);

	if (typeof (point.time) !== "undefined") {
		var time = doc.createElement("Time");
		trkpt.appendChild(time);
		time.appendChild(doc.createTextNode((point.time.substring(0,23) + "Z"))); // This was required to make the import into Garmin Connect work - should really move to UTC....
	}
	
	var pos = doc.createElement("Position");
	trkpt.appendChild(pos);
	
	var lat = doc.createElement("LatitudeDegrees");
	var lon = doc.createElement("LongitudeDegrees");
	lat.appendChild(doc.createTextNode(point.lat));
	lon.appendChild(doc.createTextNode(point.lon));
	pos.appendChild(lat);
	pos.appendChild(lon);
	
	var ele = doc.createElement("AltitudeMeters");
	//trkpt.appendChild(ele);
	ele.appendChild(doc.createTextNode(point.ele));

	if (typeof (point.hr) !== "undefined" && point.hr != 0) {
		var hr = doc.createElement("HeartRateBpm");
		hr.appendChild(doc.createTextNode(point.hr));
		trkpt.appendChild(hr);
	}
}

function processSplits(data) {
	if(typeof (data.geo) == "undefined" || typeof(data.geo.waypoints) == "undefined") {
		updateSM("No geo or waypoints (i.e. no GPS coords). No need to process splits.");
		return;
	}
	var distanceData;
	//var distanceData = findDistanceData(data);
	 
	var startDate = new Date(data.startTimeUtc);
	var startMs = startDate.getTime();
	updateSM("Start Time (ms):" + startMs);
	data.geo.waypoints[0].time = getISOFromDuration(data, startMs, 0);

	var curSplit = 0;
	var split = data.snapshots.KMSPLIT.datasets[curSplit];
	var lastSplitIdx = 0;
	var lastSplitDuration = 0;

	for (i = 0; i < data.geo.waypoints.length; i++) {
		if (typeof (split) == "undefined") {
			break;
		}
		var pt = data.geo.waypoints[i];
		// Look for the split (e.g. looking through until we hit the x km mark, then we "process the gap" up to that point.
		if (pt.lat == split.gpsLat && pt.lon == split.gpsLong) {
			// Found the point with the same location as the split.
			// Add the HR data and time to trkpt at split
			pt.hr = split.heartRate;		
			pt.time = getISOFromDuration(data, startMs, split.duration);
			// updateSM("Found split: " + split.distance + " on waypoint: " + i
			// + "(lat: " + pt.lat + ", long: " + pt.lon + "). Time: " + pt.time
			// + "; " + (split.duration));
			processGap(data, lastSplitIdx, i, split.duration
					- lastSplitDuration, startMs + lastSplitDuration, distanceData);
			curSplit++;
			lastSplitIdx = i;
			lastSplitDuration = split.duration;
			split = data.snapshots.KMSPLIT.datasets[curSplit];
		}

	}
	var endDateMs = startMs + data.duration;
	data.geo.waypoints[data.geo.waypoints.length - 1].time = getISOFromDuration(
			data, startMs, data.duration);
	processGap(data, lastSplitIdx, data.geo.waypoints.length - 1, data.duration
			- lastSplitDuration, startMs + lastSplitDuration);
	updateSM("End Time (ms):" + endDateMs);
	updateSM("Seconds:" + ((endDateMs - startMs) / 1000));
}
function processGap(data, fromIdx, toIdx, split, startMs, distanceData) {
	if(typeof (data.geo) == "undefined" || typeof(data.geo.waypoints) == "undefined") {
		updateSM("No geo or waypoints (i.e. no GPS coords). No need to process gap.");
		return;
	}
	var num = toIdx - fromIdx;
	if (num > 0) {
		var inc = split / num;
		updateSM(fromIdx + "," + toIdx + "," + split + "," + num + "," + inc
				+ "," + startMs);
		var loop = 1;
		for (i = fromIdx + 1; i < toIdx; i++) {
			data.geo.waypoints[i].time = getISOFromDuration(data, startMs, (inc * loop));
			//matchDistanceData(distanceData, (inc * loop), data.geo.waypoints[i].time);
			loop++;
		}
	}
}

function findDistanceData(data) {
	// Find distance element
	if(typeof(data.history) == "undefined") {
		// No history distance data
		//updateSM("No History/Distance data to append.");
		return;
	}
	var distPos = -1;
	for(i = 0; i < data.history.length; i++) {
		if(data.history[i].type == "DISTANCE") {
			distPos = i;
			break;
		}
	}
	
	if(distPos == -1) {
		// No history distance data
		//updateSM("No distance data found in History.");
		return;
	}
	
	if(data.history[i].intervalType != "TIME" && data.history[i].intervalUnit != "SEC") {
		//updateSM("We only understance Time type intervals and Second based interval units.");
		return;
	}
	
	var interval = data.history[i].intervalMetric;
	var distValues = data.history[i].values;
	

	
	return [interval, distValues];
}

function matchDistanceData(distanceData, time, pt) {
	if(typeof(distanceData) == "undefined") {
		return;
	}
	var interval = distanceData[0];
	interval = interval * 1000;
	var values = distanceData[1];
	
	var diff = time / interval;
	updateSM("matchDistanceData: diff = " + diff +", Time: " + time + ", Interval: " + interval + ", Point-Time: " + pt);
	return values[diff];	
}


function getTimeWithDuration(data, start, offset) {
	var tz = getTZ(data);
	var tzh = tz.substring(1, tz.indexOf(":"));
	var op = tz.substring(0, 1);
	var tzm = tz.substring(tz.indexOf(":") + 1);
	// updateSM("TZH: " + tzh + ", op: " + op + ", TZM: " + tzm);
	var tzms = tzh * 1000 * 60 * 60;
	var tzms = tzms + (tzm * 1000 * 60);
	var i = start + offset;
	if (op == "+")
		i = i + tzms;
	else
		i = i - tzms;
	return i;
}

function getISOFromDuration(data, start, offset) {
	
	var d = new Date(getTimeWithDuration(data, start, offset));
	var str = d.toISOString();
	return str.substring(0, str.length - 1) + getTZ(data);
}

function getTZ(data) {
	if(typeof (data.timeZone) == "undefined") {
		if(typeof (data.timeZoneId) == "undefined") {
			throw "No timezone information"; 
		} else {
			var ix = data.timeZoneId.indexOf("+");
			if(ix < 0) {
				ix = data.timeZoneId.indexOf("-");
			}
			if(ix < 0) {
				// Assume OK?
				updateSM("Assuming TimeZone has no TimeZoneId? : " + data.timeZoneId);
				return data.timeZoneId;
			}

			return data.timeZoneId.substring(ix+1);
		}
	} else {
		return data.timeZone;
	}
}

/* use a function for the exact format desired... */
function ISODateString(d) {
	function pad(n) {
		return n < 10 ? '0' + n : n
	}
	return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-'
			+ pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':'
			+ pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z'
}

function appendWpt(doc, seg, point, startMs) {
	var trkpt = doc.createElement("wpt");
	seg.appendChild(trkpt);

	trkpt.setAttribute("lat", point.gpsLat);
	trkpt.setAttribute("lon", point.gpsLong);

	if (typeof (point.duration) !== "undefined") {
		var time = doc.createElement("time");
		trkpt.appendChild(time);
		var d = new Date(startMs + point.duration);
		time.appendChild(doc.createTextNode(d.toISOString()));
	}
	if (typeof (point.name) !== "undefined") {
		var name = doc.createElement("name");
		trkpt.appendChild(name);
		name.appendChild(doc.createTextNode(point.name));
	}
}

function xml2Str(xmlNode) {
	try {
		// Gecko- and Webkit-based browsers (Firefox, Chrome), Opera.
		return (new XMLSerializer()).serializeToString(xmlNode);
	} catch (e) {
		try {
			// Internet Explorer.
			return xmlNode.xml;
		} catch (e) {
			// Other browsers without XML Serializer
			alert('Xmlserializer not supported');
		}
	}
	return false;
}

window.onload = function() {
};
