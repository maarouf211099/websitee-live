
var imageMersalMap = '/images/logoToMap.png';
var MersalDefultLocation = { lat: 30.1, lng: 31.1 };
var map;

var SetMarkarsMap = [];

function initializeCreateNewBranche() {
    map = new google.maps.Map(document.getElementById('MersalmapBranches'), {
        zoom: 10,
        center: MersalDefultLocation,
    });

}
google.maps.event.addDomListener(window, 'load', initializeCreateNewBranche);
function addMarker(location, map, title) {
    var marker = new google.maps.Marker({
        position: location,
        map: map,
        icon: imageMersalMap,
        title: title,
    });
} 


function DrawContactUsCarsd(json) {
  
    var html = ""; 
     
    var template = `
            <div class="contact-us-card col-lg-4 col-md-12">
            <h1> `+(_cultureIsArabic?'#BrancheNameAr#': '#BrancheNameEn#' )+` </h1>
            <p>`+(_cultureIsArabic?'#AddressAR#': '#AddressEN#' )+`</p>
            <div class="phone">
            <h6> `+(_cultureIsArabic?'التليفون': 'Phone' )+` </h6>
            <a href="tel:+#phone#">#phone#</a>
           
            </div>
            <div class="mail">
            <h6>`+(_cultureIsArabic?'البريد الإليكتروني': 'Email' )+`</h6>
            <a href="mailto:#Email#">#Email#</a>
            </div>
            </div>
    `;
 
    for (var i = 0; i < json.length; i++) {
 
  
    var res=  template.replaceAll("#BrancheNameAr#", json[i].NameAR)
    .replaceAll("#BrancheNameEn#", json[i].NameEN)       
    .replaceAll("#AddressAR#", json[i].AddressAR)
    .replaceAll("#AddressEN#",  json[i].AddressEN)
    .replaceAll("#phone#", json[i].Tel) 
    .replaceAll("#Email#", json[i].EMail);
     
   
      html += res;
 
    }
 
    $("#BranchesDiv").html(html);



}
 

$(document).ready(function () {
    console.log("ContactUs")
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: MersalWebAPIBaseUrl + "api/BrancheDetails/GetAllBranches",
        async: true,
        success: function (data) {
            DrawContactUsCarsd(data);
            var htmlTempAR = '<div><strong>#BrancheName#</strong><p>#BrancheAddress#</p><strong>التليفون</strong><p>#BranchePhone#</p><strong>البريد الإليكتروني</strong><p>#BrancheEmail#</p></div></br>';
            var htmlTempEN = '<div><strong>#BrancheName# </strong> <p>#BrancheAddress#</p><strong>Tel </strong><p>#BranchePhone#</p><strong>Email </strong><p>#BrancheEmail#</p></div></br>';
            var html = "";
            var slide = '<div class="unitDonation"><img src="#src#"><strong class="popup-title">#head#</strong><p>#des#</p></div>';
            $.each(data, function (key, value) {
                // if (_cultureIsArabic) {
                //     html += htmlTempAR
                //         .replace("#BrancheName#", value.NameAR)
                //         .replace("#BrancheAddress#", value.AddressAR)
                //         .replace("#BranchePhone#", value.Tel)
                //         .replace("#BrancheEmail#", value.EMail)

                // } else {
                //     html += htmlTempEN
                //       .replace("#BrancheName#", value.NameEN)
                //       .replace("#BrancheAddress#", value.AddressEN)
                //       .replace("#BranchePhone#", value.Tel)
                //       .replace("#BrancheEmail#", value.EMail)
                // }
                var MarkarsOnMap = function () {
                    var loc = { lat: Number(value.latMap), lng: Number(value.lngMap) };
                    addMarker(loc, map, value.TitleMap);
                };
                SetMarkarsMap.push(MarkarsOnMap);
            });
             setTimeout(function () {
                google.maps.event.trigger(map, "resize");
                SetMarkarsMap.forEach(function (entry) {
                    entry();
                });
            }, 1000);
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });

    var ContactUsForm = $("#ContactUsForm");
    ContactUsForm.submit(function (e) {
        $.validator.unobtrusive.parse(ContactUsForm)
        e.preventDefault();

        if (!ContactUsForm.valid()) return;
        var apiurl = MersalWebAPIBaseUrl + "api/ContactUs/ContactUs";
        var data = {};

        $("#ContactUsForm").serializeArray().map(function (x) { data[x.name] = x.value; });
        debugger;
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: true,
            beforeSend: function () {
                $("#imgAjaxLoader").show();
            },
            success: function (data) {
                $("#imgAjaxLoader").hide();
                toastr.success(SuccessfulProcess);
                document.getElementById("ContactUsForm").reset();
                $("#CountryName").val("");
                $("#countryError").hide();
            },
            error: function (xhr) {
                $("#imgAjaxLoader").hide();
                toastr.error(xhr.error);
            }
        });
    });
    //GetAnyMasterDetalisCode('Coun', 'countryContactId', false, true, "", "", true);
     
    //$("#countryContactId").change(function () {
    //    var thisvalue = $(this).find("option:selected").text();
    //    thisvalue
    //    if (thisvalue == "" ) {
    //     $("#CountryName").val(thisvalue);
    //     $("#countryError").show();
    //    }
    //    else {
    //        $("#CountryName").val(thisvalue);
    //        $("#countryError").hide();
    //    }

       
    //});
});