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

	// set the dimensions and margins of the graph
	let margin = {top: 10, right: 30, bottom: 30, left: 30},
	    width = 800 - margin.left - margin.right,
	    height = 400 - margin.top - margin.bottom;

	// append the svg object to the body of the page
	document.getElementById("ebikeGraph").innerHTML = "";
	let svg = d3.select("#ebikeGraph")
		.append("svg")
  		.attr("viewBox", '0 0 800 400')
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

//Bikes and docks Listener
firebase.database().ref('bikes_and_docks').on('value', function(snapshot) {
	let bd = snapshot.val();

	let bikesAndDocks = {
		bikes: [],
		docks: []
	}
	for(i in bd) {
		bikesAndDocks.bikes.push({
			name: "available",
			date: i,
			value: bd[i].bikes_available
		});
		bikesAndDocks.bikes.push({
			name: "disabled",
			date: i,
			value: bd[i].bikes_disabled
		});
		bikesAndDocks.docks.push({
			name: "available",
			date: i,
			value: bd[i].docks_available
		});
		bikesAndDocks.docks.push({
			name: "disabled",
			date: i,
			value: bd[i].docks_disabled
		});
	}
	displayDocksAndBikes(bikesAndDocks.docks, "dockGraph", "Docks");
	displayDocksAndBikes(bikesAndDocks.bikes, "bikeGraph", "Bikes");
});

//Display Bikes
function displayDocksAndBikes(data, elementId, itemName) {

	// set the dimensions and margins of the graph
	let margin = {top: 10, right: 30, bottom: 30, left: 60},
	    width = 800 - margin.left - margin.right,
	    height = 400 - margin.top - margin.bottom;

	// append the svg object to the body of the page
	document.getElementById(elementId).innerHTML = "";
	let svg = d3.select("#" + elementId)
		.append("svg")
  		.attr("viewBox", '0 0 800 400')
		.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	// group the data: I want to draw one line per group
	let sumstat = d3.nest() // nest function allows to group the calculation per level of a factor
		.key(function(d) { return d.name;})
		.entries(data);

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
	svg.append("text").attr("x", 15).attr("y", 15).text("Available " + itemName).style("font-size", "15px").attr("alignment-baseline","middle")
	svg.append("text").attr("x", 165).attr("y", 15).text("Disabled " + itemName).style("font-size", "15px").attr("alignment-baseline","middle")


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
  		.attr("viewBox", '0 0 800 460')
		.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	// group the data: I want to draw one line per group
	let sumstat = d3.nest() // nest function allows to group the calculation per level of a factor
		.key(function(d) { return d.name;})
		.entries(data);

	// Add X axis --> it is a date format
	let x = d3.scaleTime()
		.domain(d3.extent(data, function(d) { return d.date; }))
		.range([ 0, width ]);

	svg.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x));

	// Add Y axis
	let min = d3.min(data, function(d) { return +d.value; });
	let max = d3.max(data, function(d) { return +d.value; })
	// if(min < max/2) min = 0;
	// else min = max - min;
	min = 0;
	let y = d3.scaleLinear()
		.domain([min, max*1.2])
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
	let times = snapshot.val();

	let data = [];
	for(t in times) {
		for(l in times[t]) {
			let leader = times[t][l];
			let datum = {
				date: parseInt(t),
				name: leader.user,
				value: leader.points
			}
			data.push(datum);
		}
	}

	// set the dimensions and margins of the graph
	let margin = {top: 30, right: 0, bottom: 30, left: 50},
	    width = 210 - margin.left - margin.right,
	    height = 210 - margin.top - margin.bottom;

	// group the data: I want to draw one line per group
	let sumstat = d3.nest() // nest function allows to group the calculation per level of a factor
		.key(function(d) { return d.name;})
		.entries(data);

	sumstat.sort(function(a, b) {
	  a = Object.values(a.values);
	  b = Object.values(b.values);

	  a = a[a.length-1].value;
	  b = b[b.length-1].value;

	  return b - a;
	});

	// What is the list of groups?
	allKeys = sumstat.map(function(d){return d.key})

	// Add an svg element for each group. The will be one beside each other and will go on the next row when no more room available
	document.getElementById("leaderboardGraph").innerHTML = "";
	let svg = d3.select("#leaderboardGraph")
		.selectAll("uniqueChart")
		.data(sumstat)
		.enter()
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// Add X axis --> it is a date format
	let x = d3.scaleTime()
		.domain(d3.extent(data, function(d) { return d.date; }))
		.range([ 0, width ]);
	
	svg.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x).ticks(3));

	//Add Y axis
	let y = d3.scaleLinear()
		.domain([0, d3.max(data, function(d) { return +d.value; })])
		.range([ height, 0 ]);
	
	svg.append("g")
		.call(d3.axisLeft(y).ticks(6));

	// color palette
	let color = d3.scaleOrdinal()
		.domain(allKeys)
		.range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#a65628','#f781bf','#999999'])

	// Draw the line
	svg.append("path")
		.attr("fill", "none")
		.attr("stroke", function(d){ return color(d.key) })
		.attr("stroke-width", 1.9)
		.attr("d", function(d){
			return d3.line()
				.x(function(d) { return x(d.date); })
				.y(function(d) { return y(+d.value); })
			(d.values)
		});

	// Add titles
	svg.append("text")
		.attr("text-anchor", "start")
		.attr("y", -5)
		.attr("x", 0)
		.text(function(d){ return(d.key)})
		.style("fill", function(d){ return color(d.key) })

});

// //Stations Listener
var stationsData;
firebase.database().ref('stations').on('value', function(snapshot) {
	handleEbikeWavers(snapshot.val());


	stationsData = snapshot.val();
	generateStationsTable()

    
});

var alphaOrder = true;
var sortBy = "name";
function generateStationsTable(e) {
	if(e) {
		if(sortBy == e.getAttribute("sortby")) {
			alphaOrder = !alphaOrder;
		} else {
			sortBy = e.getAttribute("sortby");
			alphaOrder = true;
		}
	}
	let table = document.getElementById("stationsTable");
	table.innerHTML = "";

	let stationsArray = [];
	let url = "https://www.google.com/maps/search/?api=1&query="
	for(i in stationsData) {
		let s = stationsData[i];
    	if(!s.installed) continue;
 
		let temp = {
			name: s.name,
			capacity: s.capacity,
			bikes: s.bikes_available/s.capacity * 100,
			docks: s.docks_available/s.capacity * 100,
			renting: "✅",
			returning: "✅",
			valet: "❌",
			angel_points: s.bike_angels_points,
			angel_action: "",
			lat: s.coordinates[1],
			lon: s.coordinates[0],
		};
		temp.url = url + temp.lat + ", " + temp.lon;
		if(s.capacity == 0) temp.bikes = 0;
		if(s.capacity == 0) temp.docks = 0;
		if(!s.renting) temp.renting = "❌";
		if(!s.returning) temp.returning = "❌";
		if(s.valet != "none") temp.returning = "✅";
		if(s.bike_angels_action == "take") {
			temp.angel_action = "⬆️";
		} else if(s.bike_angels_action == "give") {
			temp.angel_action = "⬇️";
		}

		stationsArray.push(temp);
	}
	// sort by name
	stationsArray.sort(function(a, b) {
	  var A = a[sortBy];
	  var B = b[sortBy];
	  if (A < B) {
	  	if(alphaOrder) {
	  		return -1;
	  	}
	  	return 1;
	  } else if (A > B) {
	  	if(alphaOrder) {
	  		return 1;
	  	}
	  	return -1;
	  } else {
	  	return 0;
	  }
	});

    for(i in stationsArray) {
    	let s = stationsArray[i];

    	let row = table.insertRow(-1);

    	var cell0 = row.insertCell(0);
		var cell1 = row.insertCell(1);
    	var cell2 = row.insertCell(2);
		var cell3 = row.insertCell(3);
    	var cell4 = row.insertCell(4);
		var cell5 = row.insertCell(5);
    	var cell6 = row.insertCell(6);
		var cell7 = row.insertCell(7);
    	var cell8 = row.insertCell(8);

		cell0.innerHTML = "<a href=\"" + s.url + "\" class=\"stationMapLink\" target=\"_blank\">" + s.name + "</a>";
		cell1.innerText = s.capacity;
		cell2.innerText = s.bikes.toFixed(0) + "%";
		cell3.innerText = s.docks.toFixed(0) + "%";
		cell4.innerText = s.renting;
		cell5.innerText = s.returning;
		cell6.innerText = s.valet;
		cell7.innerText = s.angel_points;
		cell8.innerText = s.angel_action;
    }

    let headers = document.getElementsByTagName("th");
    for(i in headers) {
    	let h = headers[i];
    	if(!isElement(h)) continue;
    	console.log();
    	if(h.getAttribute("sortby") == sortBy) {
    		h.style.color = "rgb(25, 150, 225)";
    		alphaOrder ? h.children[0].innerHTML = "&#x25B2;" : h.children[0].innerHTML = "&#x25BC;";
    	} else {
    		h.style.color = "#000";
    		h.children[0].innerHTML = "";
    	}
    }
    filterTable();
}

function filterTable() {
  // Declare variables
  var input, filter, table, tr, td, i, txtValue;
  input = document.getElementById("filterInput");
  filter = input.value.toUpperCase();
  table = document.getElementById("stationsTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[0];
    if (td) {
      txtValue = td.textContent || td.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}


function handleEbikeWavers(stations) {
	// let ebikeWaivers = ["hello", "how", "are", "you"];
	let ebikeWaivers = [];
	for(i in stations) {
		let s = stations[i];
		let name = s.name
		let waiver = s.ebike_surcharge_waiver;

		if(waiver) {
			ebikeWaivers.push(name);
		}
	}

	let ul = document.getElementById("ebikeWaiverList");

	ul.innerHTML = "";
	for(i in ebikeWaivers) {
		let li = document.createElement("li");
		li.innerText = ebikeWaivers[i];
		ul.append(li);
	}
	if(ebikeWaivers.length == 0) {
		document.getElementById("ebikeWaiverDiv").setAttribute("hidden", "true");
	} else {
		document.getElementById("ebikeWaiverDiv").removeAttribute("hidden");
	}
}


//Handle the page display
displayHandler();
function displayHandler() {
	document.getElementById("sidebarMenu").classList.remove("show");
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