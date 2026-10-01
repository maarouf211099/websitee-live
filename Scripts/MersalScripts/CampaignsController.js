$(document).ready(function () {
    var apiUrl = MersalWebAPIBaseUrl + "api/CampaignAPI/GetAllCampaignHomeView";
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: apiUrl,
        headers: getHeaders(),
        async: true,
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (data) {

            if (data.length == 0) {
                $("#Campaigns").addClass("display-none");
            } else {
                DrawCampagins(data);
            }



            $("#imgAjaxLoader").hide();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
            $("#imgAjaxLoader").hide();
        }
    });


     setInterval(function () { slideLeft(); }, 3000);

});








function DrawMain(json) {
    $("#campaignsSection").css('display', 'block');
    $("#campaignsSection2").css('display', 'block');
    //var Maintemplate = '<div class="container" style="border: rgba(153, 142, 153, 0.1);border-style: double;"><div class="col-md-6 column"><div class="urgentcause-detail">'
    //             + '#Destinations#'
    //             + '<span><i class="fa fa-calendar"></i>&nbsp; #StartDateS#   #EndDateS#  &nbsp; </span>'
    //             + '<h3><a href="#hrefTitle#" >#title#</a></h3>'
    //             + '<p>#Goal#</p><a href="#hrefRead#" >&nbsp;' + ReadMore + '&nbsp;<i  class="fa fa-angle-double-left" style="float: none;"></i></a>'
    //             + '<div class="urgent-progress"><div class="row">'
    //             + '<div class="col-md-4"><div class="amount"><i>£</i> #Remaining#<span>' + Remaining + '</span></div></div>'
    //             + '<div class="col-md-4"><div class="circular">'
    //            // + '<input class="knob" data-fgColor="#e47257" data-bgColor="#dddddd" data-thickness=".10" readonly value="#valuePrexentage#" />'
    //             + '<a class="call-popup" style="cursor: pointer;" onclick="callDonationpopup(3, #IdDonate# ,#AccountIdDonate#,#TitleDonate#,#remainingDonate#)">' + DonateNow + '</a></div></div>'
    //             + '<div class="col-md-4"><div class="amount"><i>£</i> #RequiredAmount#<span>' + Goal + '</span></div></div>'
    //             + '</div></div></div></div><div class="col-md-6 column"><div class="urgentcause-gallery">'
    //             + '#Images#'
    //             + '</div></div></div>';
    var Maintemplate = '<div class="container" style="border: rgba(153, 142, 153, 0.1);border-style: double;"><div class="col-md-6 column"><div class="urgentcause-detail">'
        + '#Destinations#'
        + '<span><i class="fa fa-calendar"></i>&nbsp; #StartDateS#   #EndDateS#  &nbsp; </span>'
        + '<h3><a href="#hrefTitle#" >#title#</a></h3>'
        + '<p>#Goal#</p><a href="#hrefRead#" >&nbsp;' + ReadMore + '&nbsp;<i  class="fa fa-angle-double-left" style="float: none;"></i></a>'
        + "#DonatePart#"
        + '</div></div></div></div><div class="col-md-6 column"><div class="urgentcause-gallery">'
        + '#Images#'
        + '</div></div></div>';
    $("#projectsContainerDiv").html("");

    for (var i = 0; i < json.length; i++) {

        if (json[i].PublishAsMain) {

            var destinationHTML = "";
            if (_cultureIsArabic) {
                json[i].TitleEn = json[i].TitleAr;
                json[i].DescriptionEn = json[i].DescriptionAr;
                json[i].GoalEn = json[i].GoalAr;
                destinationHTML = setMainDestinationHTML(json[i].DestinationsListAr);
            }
            else {
                destinationHTML = setMainDestinationHTML(json[i].DestinationsListEn);
            }
            var imageHTML = setMainImageHTML(json[i].ThumbnailsPathsList);
            var endDateVal = "";
            if (json[i].EndDateS != null) {
                endDateVal = " - " + json[i].EndDateS;
            }
            var DonationHtml = ""
            if (json[i].RemainingAmount > 0) {
                DonationHtml = setDonationSection(json[i]);
            }
            else {
                DonationHtml = setDonationSection2();
            }
            var res = Maintemplate

                .replace("#Destinations#", destinationHTML)
                .replace("#Images#", imageHTML)
                .replace("#title#", json[i].TitleEn)
                .replace("#hrefTitle#", ("/CampaignUI/Details/" + json[i].Id))
                .replace("#hrefRead#", ("/CampaignUI/Details/" + json[i].Id))
                .replace("#StartDateS#", json[i].StartDateS)
                .replace("#EndDateS#", endDateVal)
                .replace("#Goal#", json[i].DescriptionEn)
                .replace("#DonatePart#", DonationHtml)
            //         .replace("#Remaining#", json[i].RemainingAmount)
            //         .replace("#RequiredAmount#", json[i].RequiredAmount)
            //         .replace("#valuePrexentage#", ((json[i].CurrentBalanc / json[i].RequiredAmount) * 100).toFixed(1))
            ////--- donation
            //         .replace("#IdDonate#", "'"+json[i].Id+"'")
            //         .replace("#AccountIdDonate#", "'" + json[i].AccountId + "'")
            //         .replace("#TitleDonate#", "'" + json[i].TitleEn + "'")
            //         .replace("#remainingDonate#", "'" + json[i].RemainingAmount + "'")
            $("#projectsContainerDiv").append(res);
        }
    }
}


function setMainDestinationHTML(DestinationList) {
    var result = "";
    for (var i = 0; i < DestinationList.length; i++) {
        result += '<span><i class="fa fa-map-marker"></i> &nbsp; ' + DestinationList[i] + ' &nbsp; </span>';
    }
    return result;
}

function setMainImageHTML(imageslist) {
    var result = "";
    if (imageslist[0]) result += '<div class="col-md-7"><a><img  src="' + imageslist[0] + '" style="width: 322px;height: 193px;"/></a></div>';
    if (imageslist[1]) result += '<div class="col-md-5"><a><img  src="' + imageslist[1] + '" style="width: 230px;height: 193px;"/></a></div>';
    if (imageslist[2]) result += '<div class="col-md-5"><a><img  src="' + imageslist[2] + '" style="width: 230px;height: 193px;"/></a></div>';
    if (imageslist[3]) result += '<div class="col-md-7"><a><img  src="' + imageslist[3] + '" style="width: 322px;height: 193px;"/></a></div>';
    return result;
}

function setDonationSection(Campaign) {
    Donationtemplate = '<div class="urgent-progress"><div class="row">'
        + '<div class="col-md-4"><div class="amount"><i>£</i> #Remaining#<span>' + Remaining + '</span></div></div>'
        + '<div class="col-md-4"><div class="circular">'
        // + '<input class="knob" data-fgColor="#e47257" data-bgColor="#dddddd" data-thickness=".10" readonly value="#valuePrexentage#" />'
        + '<a class="call-popup" style="cursor: pointer;" onclick="callDonationpopup(3, #IdDonate# ,#AccountIdDonate#,#TitleDonate#,#remainingDonate#)">' + DonateNow + '</a></div></div>'
        + '<div class="col-md-4"><div class="amount"><i>£</i> #RequiredAmount#<span>' + Goal + '</span></div></div>';
    var res = Donationtemplate.replace("#Remaining#", Campaign.RemainingAmount)
        .replace("#RequiredAmount#", Campaign.RequiredAmount)
        .replace("#valuePrexentage#", ((Campaign.CurrentBalanc / Campaign.RequiredAmount) * 100).toFixed(1))
        //--- donation
        .replace("#IdDonate#", "'" + Campaign.Id + "'")
        .replace("#AccountIdDonate#", "'" + Campaign.AccountId + "'")
        .replace("#TitleDonate#", "'" + Campaign.TitleEn + "'")
        .replace("#remainingDonate#", "'" + Campaign.RemainingAmount + "'");
    return res;
}
function setDonationSection2() {
    Donationtemplate = '<div class="urgent-progress"><div class="row">'
        + '<div class="col-md-4"><div class="amount"></div></div>'
        + '<div class="col-md-4"><div class="circular">'

        + '</div></div>'
        + '<div class="col-md-4"><div class="amount"></div></div>';
    var res = Donationtemplate;
    return res;
}


var container = '';
var slideTotal = '';
var slideCurrent = '';
var slide;



function DrawCampagins(json) {
    var html = "";

    var template = `
    
    <div class="slider-single">
    <img class="slider-single-image" src="#ImagePath#" alt="5" />
    
    <a class="slider-single-likes" href="CampaignUI/CompaignHomeDetails?compaignId=#compaignId#">
        
         <h1>`+ (_cultureIsArabic ? '#TitleAr#' : '#TitleEn#') + `</h1>
         <p>  `+ (_cultureIsArabic ? '#DescriptionAr#' : '#DescriptionEn#') + ` </p>
         <div class="wanted-remaining">
         <b>   مطلوب :  <span>#RequiredAmount#</span></b>  
         <b> متبقي : <span>#RemainingAmount#</span>   </b> 
         </div>
        
    </a>
</div>`;



    var singleCard = `
 <div class="single-campagin">
    <img   src=${json[0].ImagesPathsList[0]} alt="5" />

    <a class="slider-single-likes" href="CampaignUI/CompaignHomeDetails?compaignId=0">

         <h1>`+ (_cultureIsArabic ? json[0].TitleAr : json[0].TitleAr) + `</h1>
         <p>  `+ (_cultureIsArabic ? json[0].DescriptionAr :  json[0].DescriptionEn ) + ` </p>
         <div class="wanted-remaining">
         <b>   مطلوب :  <span>${json[0].RequiredAmount}</span></b>  
         <b> متبقي : <span>${json[0].RemainingAmount}</span>   </b> 
         </div>
        
    </a>
</div>`


   

    for (var i = 0; i < json.length; i++) {
       
        json[i].DescriptionAr = json[i].DescriptionAr.replace(/<[^>]*>?/gm, "")
            .replace(/&nbsp;/g, "");

        json[i].DescriptionEn = json[i].DescriptionEn.replace(/<[^>]*>?/gm, "")
            .replace(/&nbsp;/g, "");

        var res = template.replaceAll("#TitleAr#", json[i].TitleAr)
            .replaceAll("#TitleEn#", json[i].TitleEn)
            .replaceAll("#ImagePath#", json[i].ImagesPathsList[0])
            .replaceAll("#compaignId#", i)
            .replaceAll("#RequiredAmount#", json[i].RequiredAmount)
            .replaceAll("#RemainingAmount#", json[i].RemainingAmount)
            .replaceAll("#DescriptionAr#", json[i].DescriptionAr.substring(0, 60) + " .... ")
            .replaceAll("#DescriptionEn#", json[i].DescriptionEn.substring(0, 60) + " .... ");

        html += res;
    }

    if (json.length > 1) {

        $("#CompaignsDevContent").html(html);
    } else {

        $("#CompaignsDevContent").html(singleCard);
    }

    slideInitial();


}


function setCampaignDestinationHTML(DestinationList) {
    var result = "";
    for (var i = 0; i < DestinationList.length; i++) {
        result += '<div class="count-down0 is-countdown"><span> <i class="fa fa-map-marker"></i> &nbsp;' + DestinationList[i] + ' &nbsp; </span></div>'
    }
    return result;
}




function openPanalCampaign(elemnt) {
    $(elemnt).find(".event-desc").css("display", "block");
}


const repeat = false;
const noArrows = false;
const noBullets = false;


function slideInitial() {

    setTimeout(function () {
        container = document.querySelector('.slider-container');
        slide = document.querySelectorAll('.slider-single');
        slideTotal = slide.length - 1;
        slideCurrent = -1;
        slideRight();

    }, 500);



}

function autoSlide() {
    for (var i = 0; i < 20; i++) {
        debugger
        slideAuto();

    }

}


function updateBullet() {
    // if (!noBullets) {
    //     document.querySelector('.bullet-container').querySelectorAll('.bullet').forEach((elem, i) => {
    //         elem.classList.remove('active');
    //         if (i === slideCurrent) {
    //             elem.classList.add('active');
    //         }
    //     })
    // }
    // checkRepeat();
}

function checkRepeat() {
    if (!repeat) {
        if (slideCurrent === slide.length - 1) {
            slide[0].classList.add('not-visible');
            slide[slide.length - 1].classList.remove('not-visible');
            if (!noArrows) {
                document.querySelector('.slider-right').classList.add('not-visible')
                document.querySelector('.slider-left').classList.remove('not-visible')
            }
        }
        else if (slideCurrent === 0) {
            slide[slide.length - 1].classList.add('not-visible');
            slide[0].classList.remove('not-visible');
            if (!noArrows) {
                document.querySelector('.slider-left').classList.add('not-visible')
                document.querySelector('.slider-right').classList.remove('not-visible')
            }
        } else {
            slide[slide.length - 1].classList.remove('not-visible');
            slide[0].classList.remove('not-visible');
            if (!noArrows) {
                document.querySelector('.slider-left').classList.remove('not-visible')
                document.querySelector('.slider-right').classList.remove('not-visible')
            }
        }
    }
}

function slideRight() {


    if (slideCurrent < slideTotal) {
        slideCurrent++;
    } else {
        slideCurrent = 0;
    }

    if (slideCurrent > 0) {
        var preactiveSlide = slide[slideCurrent - 1];
    } else {
        var preactiveSlide = slide[slideTotal];
    }
    var activeSlide = slide[slideCurrent];
    if (slideCurrent < slideTotal) {
        var proactiveSlide = slide[slideCurrent + 1];
    } else {
        if(slide)
        var proactiveSlide = slide[0];

    }

    slide.forEach((elem) => {
        var thisSlide = elem;
        if (thisSlide.classList.contains('preactivede')) {
            thisSlide.classList.remove('preactivede');
            thisSlide.classList.remove('preactive');
            thisSlide.classList.remove('active');
            thisSlide.classList.remove('proactive');
            thisSlide.classList.add('proactivede');
        }
        if (thisSlide.classList.contains('preactive')) {
            thisSlide.classList.remove('preactive');
            thisSlide.classList.remove('active');
            thisSlide.classList.remove('proactive');
            thisSlide.classList.remove('proactivede');
            thisSlide.classList.add('preactivede');
        }
    });
    preactiveSlide.classList.remove('preactivede');
    preactiveSlide.classList.remove('active');
    preactiveSlide.classList.remove('proactive');
    preactiveSlide.classList.remove('proactivede');
    preactiveSlide.classList.add('preactive');

    activeSlide.classList.remove('preactivede');
    activeSlide.classList.remove('preactive');
    activeSlide.classList.remove('proactive');
    activeSlide.classList.remove('proactivede');
    activeSlide.classList.add('active');

    proactiveSlide.classList.remove('preactivede');
    proactiveSlide.classList.remove('preactive');
    proactiveSlide.classList.remove('active');
    proactiveSlide.classList.remove('proactivede');
    proactiveSlide.classList.add('proactive');

    updateBullet();
}



function slideLeft() {
    if(slide){
        if (slideCurrent > 0) {
            slideCurrent--;
        } else {
            slideCurrent = slideTotal;
        }
    
        if (slideCurrent < slideTotal) {
            var proactiveSlide = slide[slideCurrent + 1];
        } else {
            if(slide)
            var proactiveSlide = slide[0];
        }
        var activeSlide = slide[slideCurrent];
        if (slideCurrent > 0) {
            var preactiveSlide = slide[slideCurrent - 1];
        } else {
            var preactiveSlide = slide[slideTotal];
        }
        slide.forEach((elem) => {
            var thisSlide = elem;
            if (thisSlide.classList.contains('proactive')) {
                thisSlide.classList.remove('preactivede');
                thisSlide.classList.remove('preactive');
                thisSlide.classList.remove('active');
                thisSlide.classList.remove('proactive');
                thisSlide.classList.add('proactivede');
            }
            if (thisSlide.classList.contains('proactivede')) {
                thisSlide.classList.remove('preactive');
                thisSlide.classList.remove('active');
                thisSlide.classList.remove('proactive');
                thisSlide.classList.remove('proactivede');
                thisSlide.classList.add('preactivede');
            }
        });
    
        preactiveSlide.classList.remove('preactivede');
        preactiveSlide.classList.remove('active');
        preactiveSlide.classList.remove('proactive');
        preactiveSlide.classList.remove('proactivede');
        preactiveSlide.classList.add('preactive');
    
        activeSlide.classList.remove('preactivede');
        activeSlide.classList.remove('preactive');
        activeSlide.classList.remove('proactive');
        activeSlide.classList.remove('proactivede');
        activeSlide.classList.add('active');
    
        proactiveSlide.classList.remove('preactivede');
        proactiveSlide.classList.remove('preactive');
        proactiveSlide.classList.remove('active');
        proactiveSlide.classList.remove('proactivede');
        proactiveSlide.classList.add('proactive');
    
        updateBullet();
    }
 
}

function goToIndexSlide(index) {
    const sliding = (slideCurrent > index) ? () => slideRight() : () => slideLeft();
    while (slideCurrent !== index) {
        sliding();
    }
}


