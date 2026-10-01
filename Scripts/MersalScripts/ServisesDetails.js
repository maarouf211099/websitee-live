
const urlParams = new URLSearchParams(window.location.search);
const ServicesId = urlParams.get('ServicesId');

function DrawServicesDetails(json) {

    var ServicesDetailsDiv = `<div class=""> ${_cultureIsArabic ? json[ServicesId].ContentAR : json[ServicesId].ContentEn}</div>`;
    var ServicesImges = `<img src="${json[ServicesId].ImagePath}" alt="" />`
    var ServicesName = ` <h1> ${_cultureIsArabic ? json[ServicesId].TitleAR : json[ServicesId].TitleEN}</h1>`
    $("#ServicesDetailsDiv").html(ServicesDetailsDiv);
    $("#ServicesImges").html(ServicesImges);
    $("#ServicesName").html(ServicesName);



// debugger;


}


$(document).ready(function () {
  
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: MersalWebAPIBaseUrl + "api/DynamicPages/GetByType?typeCode=MersalServices",
        headers: getHeaders(),
        success: function (data) {

            DrawServicesDetails(data);
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
             
        }
    });
});