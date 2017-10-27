




$(function(){  
  var url = "/nshmp-haz-ws/util/testsites";
  $.getJSON(url,function(jsonReturn){
    testSites = jsonReturn.features; 
    console.log(testSites);
    setRegions();
  });
});




function setRegions(){
 
  testSites.forEach(function(site){ 
    var regionId      = site.properties.regionId;
    var regionDisplay = site.properties.regionDisplay;
    $("#region").append(
      $("<label>").addClass("btn btn-default").append(
        $("<input/>")
          .attr("name","region")
          .attr("value",regionId)
          .attr("type","radio")
      ).append(regionDisplay)
    )
  });

  $("#region [value*=WUS]")
    .parent()
    .addClass("active");
  
  plotMap();
  setTestSites();
}



function regionSelect(){
  var regionSelect = $("#region [class*=active] input").val();
  var region = testSites.find(function(fc,ifc){
    return fc.properties.regionId == regionSelect;
  });
  return region;
}


function siteSelect(){
  var region = regionSelect();
  var siteSelect = $("#testsite option:selected").val();
  var site = region.features.find(function(f,i){
    return f.properties.locationId == siteSelect;
  });
  return site != undefined ?  site : "default"; 
}



$("#region").change(function(){setTestSites()});

function setTestSites(){
  $("#lat").val("");
  $("#lon").val("");
  
  var siteOptions = $().add(
    $("<option>")
    .attr("value","default")
    .text("Please select ...")
  );
  
  var region = regionSelect();
  region.features.forEach(function(feature){
    var site   = feature.properties.location;
    var siteId = feature.properties.locationId;
    siteOptions = siteOptions.add( 
      $("<option>")
      .attr("value",siteId)
      .attr("id",siteId)
      .text(site)
    );
  })
  $("#testsite").empty().append(siteOptions);
  
  var regionId = region.properties.regionId;
  var bounds   = region.properties;
  checkBounds(regionId,bounds);


}



$("#testsite").change(function(){coordinates()});
function coordinates(){
  var region = regionSelect();
  var site   = siteSelect();
  if (site != "default"){
    var lon = site.geometry.coordinates[0];
    var lat = site.geometry.coordinates[1];
    $("#lat").val(lat);
    $("#lon").val(lon);
  }else{ 
    $("#lat").val("");
    $("#lon").val("");
  }

}


function siteRadius() {
  
  var rDefault = 5;
  var e    = d3.event;
  if (e == null || e == undefined){
    var scale = rDefault;
  }else{
    var isSelected = "active" == d3.select(this)
      .attr("class");
    var rDefault = isSelected ? rDefault*rScale : rDefault; 
    var scale = e.transform != null ?  rDefault/e.transform.k :rDefault; 
  }
  return scale;
}



function siteData(){
  var region = regionSelect();    
  var lat = [];
  var lon = []; 
  region.features.forEach(function(d,i){
    lon[i] = d.geometry.coordinates[0];
    lat[i] = d.geometry.coordinates[1];
  });
  return d3.zip(lon,lat);
}



var rScale = 2.5;

function plotMap(){

  var margin = {top: 20,right: 20,bottom: 20,left: 20};

  var region = regionSelect();

  //......................... Get Plot Height Function ............................
  function plotHeight(){
    var height = $("#map").height();              // Get the height of the plot element
    height = height - margin.top  - margin.bottom;      // Subtract the top and bottom margins
    return height;                                      // Return plottable height
  }
  //-------------------------------------------------------------------------------


  //......................... Get Plot Width Function .............................
  function plotWidth(){
    var width = $("#map").width();                // Get the width of the plot element
    width  = width  - margin.left - margin.right;       // Subtract the left and right margins
    return width;                                       // Return plottable width
  }
  //-------------------------------------------------------------------------------


  var height = plotHeight();
  var width  = plotWidth();
  

  var projection = d3.geoAlbersUsa()
    .scale(width)
    .translate([width/2,height/2])
    .fitSize([width,height],region);
  
  var path = d3.geoPath()
    .projection(projection);
  

  var svgHeight = height + margin.top   + margin.bottom;
  var svgWidth  = width  + margin.right + margin.left;

  var zoom = d3.zoom()
    .scaleExtent([0.1,10])
    .on("zoom",zoom);

  function zoom(){
    d3.select(".map")
      .attr("transform",d3.event.transform);
    d3.select(".sites")
      .attr("transform",d3.event.transform);
    d3.select(".sites")
      .selectAll("circle")
      .attr("r",siteRadius);
    d3.select(".map-borders")
      .attr("transform",d3.event.transform)
      .attr("stroke-width",1.5 / d3.event.transform.k+"px");
  }

  //................. Plot ..........................
  function plot(){
    var svg = d3.select("#map")
      .append("svg")
        .attr("class","testSiteMap")
        .attr("width",svgWidth)
        .attr("height", svgHeight)
        .append("g")
          .attr("class","svgMainGroup")
          .attr("transform","translate("+margin.left+","+margin.top+")");

    svg.call(zoom);

    var mapUrl = "/nshmp-haz-ws/data/us.json";
    d3.json(mapUrl,function(error,map){
      if (error) throw error;
      var geoJson = topojson.feature(map,map.objects.states); 
      borders = topojson.mesh(map,map.objects.states,function(a,b){return a!==b;});
      
      svg.append("g")
        .attr("class","map")
        .selectAll("path")
        .data(geoJson.features)
        .enter()
        .append("path")
        .attr("d",path)
        .style("opacity",0.65);
      
      svg.append("g")
        .attr("class","map-borders")
        .append("path")
        .attr("d",path(borders) )
        .attr("stroke","white")
        .attr("fill","none");
     
      var sites = siteData();
      svg.append("g")
        .attr("class","sites")
        .selectAll("circle")
        .data(sites)
        .enter()
        .append("circle")
        .attr("cx",function(d,i){return projection(d)[0]})
        .attr("cy",function(d,i){return projection(d)[1]})
        .attr("r",siteRadius())
        .attr("fill","red")
        .attr("id",function(d,i){return region.features[i].properties.locationId})
        .on("mouseover",siteOver)
        .on("mouseout",siteOut);
      
    });
 }
 plot();
 //-------------------------------------------------



  function plotUpdate(){
    var region = regionSelect();

    var height = plotHeight();
    var width  = plotWidth(); 
    var svgHeight = height + margin.top   + margin.bottom;
    var svgWidth  = width  + margin.right + margin.left;
    
    var svg = d3.select("#map svg");
    
    svg
      .attr("height",svgHeight)
      .attr("width",svgWidth); 

    
    projection
      .scale(width)
      .translate([width/2,height/2])
      .fitSize([width,height],region);
    
    svg.select(".map")
      .selectAll("path")
      .attr("d",path);
    
    svg.select(".map-borders")
      .select("path")
      .attr("d",path(borders) );
      
      
    svg.select(".sites")
      .selectAll("circle")
      .attr("cx",function(d,i){return projection(d)[0]})
      .attr("cy",function(d,i){return projection(d)[1]});
    
  }
        
  $(window).resize(function(){
    plotUpdate();
  });


  $("#testsite").change(function(){
    var region = regionSelect();
    
    d3.select(".sites")
      .selectAll("circle")
      .attr("r",siteRadius());
    
    var r = d3.select(".sites")
      .selectAll("circle")
      .attr("r");
    console.log(r);
    
    d3.select("#map svg")
      .select(".sites")
      .selectAll("circle")
      .attr("class","");

    var site = siteSelect();
    
    if (site != "default"){

      var siteId = site.properties.locationId;
      var siteSelected = d3.select("#map svg")
        .select(".sites")
        .selectAll("circle")
        .select(function(d,i){return region.features[i].properties.locationId == siteId ? this : null});

      siteSelected
        .attr("r",r*rScale)
        .attr("class","active");
     } 

    
    var r = d3.select(".sites")
      .selectAll("circle")
      .attr("r");
    console.log(r);
  });


  $("#region").change(function(){
    plotUpdate(); 

    var region = regionSelect();
    var width  = plotWidth();
    var height = plotHeight();
    var sites  = siteData(); 
    
    d3.select("#map svg")
      .select(".sites")
      .selectAll("circle")
      .attr("class","");

    var svgSites = d3.select("#map svg")
      .select(".sites")
      .selectAll("circle")
      .data(sites);
    
    svgSites.exit().remove();
    
    svgSites.enter()
      .append("circle")
      .on("mouseover",siteOver)
      .on("mouseout",siteOut);

    d3.select("#map svg")
    .select(".sites")
    .selectAll("circle")
    .transition()
      .duration(500)
      .attr("cx",function(d,i){return projection(d)[0]})
      .attr("cy",function(d,i){return projection(d)[1]})
      .attr("r",siteRadius())
      .attr("id",function(d,i){return region.features[i].properties.locationId})
      .attr("fill","red");

  });
  

  function siteOver(){
    var region = regionSelect();

    var siteId = d3.select(this).attr("id");
    
    var site = region.features.find(function(f,i){
      return f.properties.locationId == siteId;
    });
    var siteName = site.properties.location;
    var lat      = site.geometry.coordinates[0];
    var lon      = site.geometry.coordinates[1];

    var tooltipText = [
      "Site: "      + siteName,
      "Latitude: "  + lat,
      "Longitude: " + lon
    ];

    var tooltip = new Tooltip("map",tooltipText);
    tooltip.setTooltip();
    tooltip.setRadius(this,rScale);
  }


  function siteOut(){
    var r = d3.select(this).attr("r");
    d3.select(this).attr("r",r/rScale);
    d3.select(".d3-tooltip")
      .remove();
  }
        
} 
