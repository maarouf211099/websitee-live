

function DrawCases(json) {
  //resource 
  //resource

  var DonationIconPath = '/images/donateNowEn.png';
  if (_cultureIsArabic) {
    DonationIconPath = '/images/donateNowAr.png';
  }
  $("#CaseSection").css('display', 'block');
  var html = "";

  // var template = '<div class="col-md-4">'
  //           + '<div class="product"><div class="product-img ActivityImg"><div class="TotalCount">'
  //           + ' <div class="col-md-3" style=""><h5>' + Remaining + '</h5><h6>#remainingText#</h6></div>'
  //           + ' <div class="col-md-3" style=""><h5>' + Goal + '</h5><h6>#moneywanted#</h6></div></div>'
  //           + '<img src="#imageSRC#" onError="#DefaultImage#"/><a href="#linkurl#">' + CaseDetails + '</a></div>'
  //           + '<div class="story-Header">' 
  //           + '<div class="progress"><div style="width: #sliderwidth#%;" class="progress-bar FloatRight"></div></div>'
  //           + '<h3><a style="font-weight: 700;color: #37a1a2;">#Id# :: #CaseName#</a></h3></div>'
  //           + '<div class="story-detail"><h3><a>#Description#</a></h3></div>'
  //           + '<div class="spent-bar"><input class="btn" value="' + DonateNow + '" type="button" onclick="callDonationpopup(' + "'#DonationType#'" + ', ' + "'#CaseID#'" + ', ' + "'#AccountID#'" + ' , ' + "'#Id# :: #CaseName#'" + ' , ' + "'#remainingTextD#'" + ')"   ></div></div></div>';

  var template_for_main_case = `<div class="foucesed-case">
     <div class="casedescription">
       <p>#Description#</p>
     </div>
     <div class="monywanted">
       <div class="row">
         <div class="col-5 row counter">
           <div class="col-6"><h1>#moneywanted#</h1></div>
   
           <div class="col-6">
             <h2>`+ Goal + `</h2>
             <h3>#moneywanted#  ${_cultureIsArabic ? 'جنيه' : 'Pound'}</h3>
           </div>
         </div>
         <div class="col-2 VL"></div>
   
         <div class="col-5 row counter">
           <div class="col-6">
             <h1>#remainingText#</h1>
           </div>
           <div class="col-6">
             <h2>`+ Remaining + `</h2>
             <h3>#remainingText# ${_cultureIsArabic ? 'جنيه' : 'Pound'}</h3>
           </div>
         </div>
       </div>
     </div>
   </div>
   `;

  var template_SideCase = `
   <div class="category-card col-lg-6 col-md-12">
   <div class="border"></div>
   <a href="/Case/CaseView/#Id#">
   <img src="#imageSRC#" alt="" class="" />
   </a>
   <h5>#CaseName#</h5>
   <div class="numbers">
     <span>#moneywanted#</span>
     <span>#remainingText#</span>
   </div>
 </div>
   `;



  for (var i = 0; i < json.length; i++) {
    if (json[i].remainingText.indexOf("-") != -1) {
      json[i].remainingText = 0
    }



    if (json[i].PublishAsMain == true) {

      var main = template_for_main_case.replaceAll("#CaseName#", json[i].CaseName)
        .replaceAll("#imageSRC#", json[i].imageSrcThum)
        .replaceAll("#DefaultImage#", this.onerror = null + ";" + "this.src = '/images/logo_W.png';")
        .replaceAll("#sliderwidth#", json[i].sliderWidth)
        .replaceAll("#moneywanted#", json[i].moneyWanted)
        .replaceAll("#moneycollectedprecentage#", json[i].moneyCollectedPrecentage)
        .replaceAll("#remainingText#", json[i].remainingText)
        .replaceAll("#linkurl#", json[i].linkUrl)
        .replaceAll("#hoverbuttontext#", Donate)
        .replaceAll("#CaseID#", json[i].Id)
        .replaceAll("#AccountID#", json[i].AccountId)
        .replaceAll("#Id#", json[i].Id)
        .replaceAll("#Description#", (json[i].Description.substring(0, 150) + " ... "))
        //-- donationfun 
        .replaceAll("#Id#", json[i].Id)
        .replaceAll("#CaseName#", json[i].CaseName)
        .replaceAll("#remainingTextD#", json[i].remainingText)
        .replaceAll("#DonationType#", 1);
      // debugger
      $("#caseContaineDiv").html(main);

    } else {
      // debugger

      var res = template_SideCase.replaceAll("#CaseName#", json[i].CaseName)
        .replaceAll("#imageSRC#", json[i].imageSrcThum)
        .replaceAll("#DefaultImage#", this.onerror = null + ";" + "this.src = '/images/logo_W.png';")
        .replaceAll("#sliderwidth#", json[i].sliderWidth)
        .replaceAll("#moneywanted#", json[i].moneyWanted)
        .replaceAll("#moneycollectedprecentage#", json[i].moneyCollectedPrecentage)
        .replaceAll("#remainingText#", json[i].remainingText)
        .replaceAll("#linkurl#", json[i].linkUrl)
        .replaceAll("#hoverbuttontext#", Donate)
        .replaceAll("#CaseID#", json[i].Id)
        .replaceAll("#AccountID#", json[i].AccountId)
        .replaceAll("#Id#", json[i].Id)
        .replaceAll("#Description#", (json[i].Description.substring(0, 150) + " ... "))
        //-- donationfun 
        .replaceAll("#Id#", json[i].Id)
        .replaceAll("#CaseName#", json[i].CaseName)
        .replaceAll("#remainingTextD#", json[i].remainingText)
        .replaceAll("#DonationType#", 1);

      html += res;
    }
  }




  if (json.length < 1) {
    $("#sideCase").addClass("bottom-space");

  }

  $("#sideCase").html(html);



}

$(document).ready(function () {
  var CasesLoader = $(document.createElement('img')).attr("src", '/images/loading2.gif').addClass("AjexLoader");
  $("#loaders").append(CasesLoader);
  $.ajax({
    type: "GET",
    contentType: "application/json",
    url: MersalWebAPIBaseUrl + "api/Case/GetCasesHomeView",
    //async: false,
    headers: getHeaders(),
    beforeSend: function () {
      $(CasesLoader).show();
    },
    success: function (data) {
      if (data.length > 0) {
        DrawCases(data);
      }
      $(CasesLoader).hide();
    },
    error: function (xhr) {
      toastr.error(xhr.statusText);
      $(CasesLoader).hide();
    }
  });
});


