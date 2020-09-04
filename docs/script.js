// Your web app's Firebase configuration
var firebaseConfig = {
apiKey: "AIzaSyDjVkk2CrXYPyBqL2aKlVYwX9Tl6KSugvE",
authDomain: "citibike-tracker.firebaseapp.com",
databaseURL: "https://citibike-tracker.firebaseio.com",
projectId: "citibike-tracker",
storageBucket: "citibike-tracker.appspot.com",
messagingSenderId: "1068264952309",
appId: "1:1068264952309:web:b3c016af374e78c25490bc"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

//ebikes Listener
firebase.database().ref('ebikes').on('value', function(snapshot) {
	let ebikes = snapshot.val();
	let data = [];
	let maxIndex = 0;

	for(i in ebikes) {
		let datum = {
			date: i,
			value: 0
		};


		for(s in ebikes[i]) {
			datum.value += ebikes[i][s];
		}

		// console.log(datum);
		data.push(datum);

		if(data[data.length-1].value > data[maxIndex].value) maxIndex = data.length-1;
	}

	let currentTime = new Date(parseInt(data[data.length - 1].date));
	document.getElementById("ebikesCurrentTime").innerHTML = currentTime.toLocaleTimeString();
	document.getElementById("ebikesCurrentCount").innerHTML = data[data.length - 1].value;

	let maxTime = new Date(parseInt(data[maxIndex].date));
	document.getElementById("ebikesMaxTime").innerHTML = maxTime.toLocaleTimeString();
	document.getElementById("ebikesMaxDate").innerHTML = maxTime.toLocaleDateString();
	document.getElementById("ebikesMaxCount").innerHTML = data[maxIndex].value;


	// console.log("eBikes");
	// set the dimensions and margins of the graph
	let margin = {top: 10, right: 30, bottom: 30, left: 30},
	    width = 800 - margin.left - margin.right,
	    height = 400 - margin.top - margin.bottom;

	// append the svg object to the body of the page
	document.getElementById("ebikeGraph").innerHTML = "";
	let svg = d3.select("#ebikeGraph")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis --> it is a date format
    let x = d3.scaleTime()
      .domain(d3.extent(data, function(d) { return d.date; }))
      .range([ 0, width ]);
    xAxis = svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    // Add Y axis
    let y = d3.scaleLinear()
      .domain([0, d3.max(data, function(d) { return +d.value; })])
      .range([ height, 0 ]);
    yAxis = svg.append("g")
      .call(d3.axisLeft(y));
	    
	svg.append("g")
	    .call(d3.axisLeft(y));


	// Add a clipPath: everything out of this area won't be drawn.
    let clip = svg.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width )
        .attr("height", height )
        .attr("x", 0)
        .attr("y", 0);

    // Add brushing
    let brush = d3.brushX()                   // Add the brush feature using the d3.brush function
        .extent( [ [0,0], [width,height] ] )  // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
        .on("end", updateChart)               // Each time the brush selection changes, trigger the 'updateChart' function

    // Create the line variable: where both the line and the brush take place
    let line = svg.append('g')
      .attr("clip-path", "url(#clip)")

    // Add the line
    line.append("path")
      .datum(data)
      .attr("class", "line")  // I add the class line to be able to modify this line later on.
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x(function(d) { return x(d.date) })
        .y(function(d) { return y(d.value) })
        )

    // Add the brushing
    line
      .append("g")
        .attr("class", "brush")
        .call(brush);

    // A function that set idleTimeOut to null
    let idleTimeout
    function idled() { idleTimeout = null; }

    // A function that update the chart for given boundaries
    function updateChart() {

		// What are the selected boundaries?
		extent = d3.event.selection

		// If no selection, back to initial coordinate. Otherwise, update X axis domain
		if(!extent){
			if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
			x.domain([ 4,8])
		}else{
			x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
			line.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
		}

		// Update axis and line position
		xAxis.transition().duration(1000).call(d3.axisBottom(x))
		line
          .select('.line')
          .transition()
          .duration(1000)
          .attr("d", d3.line()
            .x(function(d) { return x(d.date) })
            .y(function(d) { return y(d.value) })
          )
    }

    // If user double click, reinitialize the chart
    svg.on("dblclick",function(){
		x.domain(d3.extent(data, function(d) { return d.date; }))
		xAxis.transition().call(d3.axisBottom(x))
		line
			.select('.line')
			.transition()
			.attr("d", d3.line()
			.x(function(d) { return x(d.date) })
			.y(function(d) { return y(d.value) })
		)
    });

});

//Bikes Available Listener
let bikes = {
	available: [],
	disabled: []
};
firebase.database().ref('bikes_available').on('value', function(snapshot) {
	// console.log("Bikes Available");
	let val = snapshot.val();
	bikes.available = [];
	for(i in val) {
		let datum = {
			name: "available",
			date: i,
			value: val[i]
		};
		bikes.available.push(datum);
	}
	displayBikes();
});

//Bikes Disabled Listener
firebase.database().ref('bikes_disabled').on('value', function(snapshot) {
	// console.log("Bikes Disabled");
	let val = snapshot.val();
	bikes.disabled = [];
	for(i in val) {
		let datum = {
			name: "disabled",
			date: i,
			value: val[i]
		};
		bikes.disabled.push(datum);
	}
	displayBikes();
});

//Display Bikes
function displayBikes() {
	// console.log(bikes);
	let data = [];
	
	for(i in bikes.available) {
		data.push(bikes.available[i])
	}
	for(i in bikes.disabled) {
		data.push(bikes.disabled[i])
	}

	// let currentTime = new Date(parseInt(data[data.length - 1].date));
	// document.getElementById("ebikesCurrentTime").innerHTML = currentTime.toLocaleTimeString();
	// document.getElementById("ebikesCurrentCount").innerHTML = data[data.length - 1].value;

	// console.log(data);


	// set the dimensions and margins of the graph
	let margin = {top: 10, right: 30, bottom: 30, left: 30},
	    width = 800 - margin.left - margin.right,
	    height = 460 - margin.top - margin.bottom;

	// append the svg object to the body of the page
	document.getElementById("bikeGraph").innerHTML = "";
	let svg = d3.select("#bikeGraph")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
		.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	// group the data: I want to draw one line per group
	let sumstat = d3.nest() // nest function allows to group the calculation per level of a factor
		.key(function(d) { return d.name;})
		.entries(data);

	// console.log(sumstat);

	// Add X axis --> it is a date format
	let x = d3.scaleTime()
		.domain(d3.extent(data, function(d) { return d.date; }))
		.range([ 0, width ]);

	svg.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x));

	// Add Y axis
	let y = d3.scaleLinear()
		.domain([0, d3.max(data, function(d) { return +d.value; })])
		.range([ height, 30 ]);

	svg.append("g")
		.call(d3.axisLeft(y));

	// color palette
	let res = sumstat.map(function(d){ return d.name }) // list of group names
	let color = d3.scaleOrdinal()
		.domain(res)
		.range(['#e41a1c','#00bbee'])

	svg.append("circle").attr("cx",0).attr("cy",15).attr("r", 6).style("fill", "#00bbee")
	svg.append("circle").attr("cx",150).attr("cy",15).attr("r", 6).style("fill", "#e41a1c")
	svg.append("text").attr("x", 15).attr("y", 15).text("Available Bikes").style("font-size", "15px").attr("alignment-baseline","middle")
	svg.append("text").attr("x", 165).attr("y", 15).text("Disabled Bikes").style("font-size", "15px").attr("alignment-baseline","middle")


	// Draw the line
	svg.selectAll(".line")
	  .data(sumstat)
	  .enter()
	  .append("path")
	    .attr("fill", "none")
	    .attr("stroke", function(d){ return color(d.key) })
	    .attr("stroke-width", 1.5)
	    .attr("d", function(d){
	      return d3.line()
	        .x(function(d) { return x(d.date); })
	        .y(function(d) { return y(+d.value); })
	        (d.values)
	    })
}

//Docks Available Listener
let docks = {
	available: [],
	disabled: []
};
firebase.database().ref('docks_available').on('value', function(snapshot) {
	// console.log("Docks Available");
	let val = snapshot.val();
	docks.available = [];
	for(i in val) {
		let datum = {
			name: "available",
			date: i,
			value: val[i]
		};
		docks.available.push(datum);
	}
	displayDocks();
});

// Docks Disabled Listener
firebase.database().ref('docks_disabled').on('value', function(snapshot) {
	// console.log("Docks Available");
	let val = snapshot.val();
	docks.disabled = [];
	for(i in val) {
		let datum = {
			name: "disabled",
			date: i,
			value: val[i]
		};
		docks.disabled.push(datum);
	}
	displayDocks();
});

//Display Bikes
function displayDocks() {
	// console.log(bikes);
	let data = [];
	
	for(i in docks.available) {
		data.push(docks.available[i])
	}
	for(i in docks.disabled) {
		data.push(docks.disabled[i])
	}

	// set the dimensions and margins of the graph
	let margin = {top: 10, right: 30, bottom: 30, left: 30},
	    width = 800 - margin.left - margin.right,
	    height = 460 - margin.top - margin.bottom;

	// append the svg object to the body of the page
	document.getElementById("dockGraph").innerHTML = "";
	let svg = d3.select("#dockGraph")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
		.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	// group the data: I want to draw one line per group
	let sumstat = d3.nest() // nest function allows to group the calculation per level of a factor
		.key(function(d) { return d.name;})
		.entries(data);

	// console.log(sumstat);

	// Add X axis --> it is a date format
	let x = d3.scaleTime()
		.domain(d3.extent(data, function(d) { return d.date; }))
		.range([ 0, width ]);

	svg.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x).ticks(5));

	// Add Y axis
	let y = d3.scaleLinear()
		.domain([0, d3.max(data, function(d) { return +d.value; })])
		.range([ height, 30 ]);

	svg.append("g")
		.call(d3.axisLeft(y));

	// color palette
	let res = sumstat.map(function(d){ return d.name }) // list of group names
	let color = d3.scaleOrdinal()
		.domain(res)
		.range(['#e41a1c','#00bbee'])

	svg.append("circle").attr("cx",0).attr("cy",15).attr("r", 6).style("fill", "#00bbee")
	svg.append("circle").attr("cx",150).attr("cy",15).attr("r", 6).style("fill", "#e41a1c")
	svg.append("text").attr("x", 15).attr("y", 15).text("Available Docks").style("font-size", "15px").attr("alignment-baseline","middle")
	svg.append("text").attr("x", 165).attr("y", 15).text("Disabled Docks").style("font-size", "15px").attr("alignment-baseline","middle")


	// Draw the line
	svg.selectAll(".line")
	  .data(sumstat)
	  .enter()
	  .append("path")
	    .attr("fill", "none")
	    .attr("stroke", function(d){ return color(d.key) })
	    .attr("stroke-width", 1.5)
	    .attr("d", function(d){
	      return d3.line()
	        .x(function(d) { return x(d.date); })
	        .y(function(d) { return y(+d.value); })
	        (d.values)
	    })
}

// //Angel Points Listener
firebase.database().ref('angel').on('value', function(snapshot) {
	let points = snapshot.val();


	// set the dimensions and margins of the graph
	let margin = {top: 10, right: 30, bottom: 30, left: 30},
	    width = 800 - margin.left - margin.right,
	    height = 460 - margin.top - margin.bottom;

	//Display Total Points
	let totalPoints = [];
	let averagePoints = [];
	let medianPoints = [];
	let maxPoints = [];
	let stationCount = [];
	for(i in points) {
		let take = [];
		let give = [];
		for(j in points[i]) {
			let s = points[i][j]
			if(s.action == "take") take.push(parseInt(s.points));
			if(s.action == "give") give.push(parseInt(s.points));
		}

		totalPoints.push({
			name: "Total \"Take\" Points",
			date: i,
			value: take.reduce((a,b) => a + b)
		});

		totalPoints.push({
			name: "Total \"Give\" Points",
			date: i,
			value: give.reduce((a,b) => a + b)
		});

		averagePoints.push({
			name: "Average \"Take\" Points",
			date: i,
			value: take.reduce((a, b) => a + b) / take.length
		});

		averagePoints.push({
			name: "Average \"Give\" Points",
			date: i,
			value: give.reduce((a, b) => a + b) / give.length
		});

		medianPoints.push({
			name: "Median \"Take\" Points",
			date: i,
			value: median(take)
		});

		medianPoints.push({
			name: "Median \"Give\" Points",
			date: i,
			value: median(give)
		});

		maxPoints.push({
			name: "Max \"Take\" Points",
			date: i,
			value: Math.max(...take)
		});

		maxPoints.push({
			name: "Max \"Give\" Points",
			date: i,
			value: Math.max(...give)
		});

		stationCount.push({
			name: "\"Take\" Stations",
			date: i,
			value: take.length
		});

		stationCount.push({
			name: "\"Give\" Stations",
			date: i,
			value: give.length
		});
	}
	displayPointsGraph(totalPoints, "pointsTotalGraph");
	displayPointsGraph(averagePoints, "pointsAverageGraph");
	displayPointsGraph(medianPoints, "pointsMedianGraph");
	displayPointsGraph(maxPoints, "pointsMaxGraph");
	displayPointsGraph(stationCount, "pointsStationsGraph");
});

function displayPointsGraph(data, divID) {
	// set the dimensions and margins of the graph
	let margin = {top: 10, right: 30, bottom: 30, left: 30},
    width = 800 - margin.left - margin.right,
    height = 460 - margin.top - margin.bottom;

	// append the svg object to the body of the page
	document.getElementById(divID).innerHTML = "";
	let svg = d3.select("#" + divID)
		.append("svg")
		.attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
		.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	// group the data: I want to draw one line per group
	let sumstat = d3.nest() // nest function allows to group the calculation per level of a factor
		.key(function(d) { return d.name;})
		.entries(data);

	// console.log(sumstat);

	// Add X axis --> it is a date format
	let x = d3.scaleTime()
		.domain(d3.extent(data, function(d) { return d.date; }))
		.range([ 0, width ]);

	svg.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x));

	// Add Y axis
	let y = d3.scaleLinear()
		.domain([0, d3.max(data, function(d) { return +d.value; })])
		.range([ height, 30 ]);

	svg.append("g")
		.call(d3.axisLeft(y));

	// color palette
	let res = sumstat.map(function(d){ return d.name }) // list of group names
	let color = d3.scaleOrdinal()
		.domain(res)
		.range(['#CCC','#333'])

	svg.append("circle").attr("cx",0).attr("cy",15).attr("r", 6).style("fill", "#333")
	svg.append("circle").attr("cx",150).attr("cy",15).attr("r", 6).style("fill", "#CCC")
	svg.append("text").attr("x", 15).attr("y", 15).text("\"Take\"").style("font-size", "15px").attr("alignment-baseline","middle")
	svg.append("text").attr("x", 165).attr("y", 15).text("\"Give\"").style("font-size", "15px").attr("alignment-baseline","middle")


	// Draw the line
	svg.selectAll(".line")
	  .data(sumstat)
	  .enter()
	  .append("path")
	    .attr("fill", "none")
	    .attr("stroke", function(d){ return color(d.key) })
	    .attr("stroke-width", 1.5)
	    .attr("d", function(d){
	      return d3.line()
	        .x(function(d) { return x(d.date); })
	        .y(function(d) { return y(+d.value); })
	        (d.values)
	    })
}

const median = arr => {
  const mid = Math.floor(arr.length / 2),
    nums = [...arr].sort((a, b) => a - b);
  return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

//Leaderboard Listener
firebase.database().ref('leaderboard').on('value', function(snapshot) {
	// console.log("Leaderboard");
	// console.log(snapshot.val());
});

// //Stations Listener
firebase.database().ref('stations').on('value', function(snapshot) {
	// console.log("Station Info");
	// console.log(snapshot.val());
	// set the dimensions and margins of the graph
});


//Handle the page display
displayHandler();
function displayHandler() {
	let hash = window.location.hash;
	if(hash == "") hash = "#";

	let navLinks = document.getElementsByClassName("nav-link");
	for(i in navLinks) {
		if(!isElement(navLinks[i])) continue;
		let href = navLinks[i].getAttribute("href");
		if(href == hash) {
			navLinks[i].classList.add("active");
		} else {
			navLinks[i].classList.remove("active");
		}		
	}

	if(hash == '#') hash = "#home"
	let mains = document.getElementsByTagName("main");
	for(i in mains) {
		if(!isElement(mains[i])) continue;
		// console.log(mains[i].id);

		if(mains[i].id == hash.substring(1)) {
			mains[i].removeAttribute("hidden");
		} else {
			mains[i].setAttribute("hidden", "true")
		}

	}
}

//Returns true if it is a DOM node
function isNode(o){
  return (
    typeof Node === "object" ? o instanceof Node : 
    o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
  );
}

//Returns true if it is a DOM element    
function isElement(o){
  return (
    typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
    o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
);
}
