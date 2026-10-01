
var drawActivities = {};

drawActivities.start = function (mersalApi, detailUrl) {

    var activitiesData = [];
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: mersalApi + "api/Activities/getAllActivity",
        async: true,
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (data) {
            $("#imgAjaxLoader").hide();
            if (data.length > 0) {
                $("#publicActData").val(true);
                $.each(data, function (i, v) {
                    var x = $(this);
                    activitiesData.push({ imgSrc: v.ActivityImagesThumbnailPaths[0], alt: "image alt", detailurl: detailUrl + v.Id, title: v.Title, price: v.Fees == null ? Free : v.Fees });
                })
                DrawActivities(activitiesData, 'activitiesContainerDiv');
            }


        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
};


var drawPublicActivities = {};

drawPublicActivities.start = function (mersalApi, detailUrl, take, skip) { 
    var PublicActivitiesLoader = $(document.createElement('img')).attr("src", '/images/loading2.gif').addClass("AjexLoader");
    $("#loaders").append(PublicActivitiesLoader);
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: mersalApi + "api/Activities/getPublicActivity?take=" + take + "&skip=" + skip,
        async: true,
        beforeSend: function () { 
            PublicActivitiesLoader.show();
        },
        success: function (data) {
            if (data.length > 0) {
                $("#publicActData").val(true); 
                DrawActivities(data, 'publicactivitiesContainerDiv');
            } 
            PublicActivitiesLoader.hide();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText); 
            PublicActivitiesLoader.hide();
        }
    });
};


var drawAcademiaActivities = {};

drawAcademiaActivities.start = function (mersalApi, detailUrl, take, skip) {
    var AcademiaActivitiesLoader = $(document.createElement('img')).attr("src", '/images/loading2.gif').addClass("AjexLoader");
    $("#loaders").append(AcademiaActivitiesLoader);
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: mersalApi + "api/Activities/getAcademiaActivity?take=" + take + "&skip=" + skip, 
        beforeSend: function () {
            $(AcademiaActivitiesLoader).show();
        },
        success: function (data) {
            if (data.length > 0) {
                $("#academicActData").val(true); 
                DrawActivities(data, 'academiaActivitiesContainerDiv');
            }
            $(AcademiaActivitiesLoader).hide();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
            $(AcademiaActivitiesLoader).hide();
        }
    });
}; 

function DrawActivities(json, divToDraw) {
    //resource
    var startdateString = "Start Date";
    var enddateString = "End Date";
    var ShowmoreString = "Show More";
    var FeesString = "Fees";
    var SeatsCapacityString = "Seats Capacity";
    var RegisterNowString = "Register Now";
    var FreeString = "Free";
    if (_cultureIsArabic) {
         startdateString = "البداية";
         enddateString = "النهاية";
         ShowmoreString = "اعرض المزيد";
         FeesString = "التكلفة";
         SeatsCapacityString = "عدد المقاعد";
         RegisterNowString = "اشترك الأن";
         FreeString = "مجانا";

    }
    //resource
    if ($("#academicActData").val() == "true") {
        $("#academiaActivitySection").css('display', 'block');
    }
    if ($("#publicActData").val() == "true") {
        $("#ActivitySection").css('display', 'block');
    }

    var html = "";
    var template = '<div class="col-md-4">'
                  + '<div class="product"><div class="product-img ActivityImg"><div class="TotalCount">'
                  + ' <div class="col-md-3" style=""><h5>' + FeesString + '</h5><h6>#price#</h6></div>'
                  + ' <div class="col-md-3" style=""><h5>' + SeatsCapacityString + '</h5><h6>#MaxCapacity#</h6></div></div>'
                  + '<img src="#imgsrc#" /><a href="#detailurl#">' + ShowmoreString + '</a></div>'
                  + '<div class="story-Header"><span class="left">' + startdateString + ' #startData#  <i class="ti-calendar"></i> </span>'
                  + '<span class="right">' + enddateString + ' #endDate#  <i class="ti-calendar"></i>  </span>'
                  + '<h3><a itemprop="url" href="#detailurl#" title="" style="font-weight: 700;color: #37a1a2;">#title#</a></h3></div>'
                  + '<div class="story-detail"><h3><a>#Description#</a></h3></div>'
                  + '<div class="spent-bar"><a   class="btn"   href="#detailurl#">' + RegisterNowString + ' <a/></div></div></div>';
                  

    for (var i = 0; i < json.length; i++) { 
        json[i].detailurl = '/Activities/Details?Id=' + json[i].Id;
        var res = template
                .replace("#imgsrc#", json[i].ActivityImagesThumbnailPaths[0])
                .replace("#detailurl#", json[i].detailurl)
                .replace("#detailurl#", json[i].detailurl)
                .replace("#detailurl#", json[i].detailurl)
                .replace("#title#", json[i].Title)
                .replace("#price#", (json[i].Fees == null ? FreeString : json[i].Fees))
                .replace("#MaxCapacity#", json[i].MaxCapacity)
                .replace("#endDate#",json[i].EndDateS)
                .replace("#startData#", json[i].StartDateS)
                .replace("#Description#", (json[i].Description.substring(0, 150) + " ... ") )
        html += res;
    }

    $("#" + divToDraw).append(html);
}


