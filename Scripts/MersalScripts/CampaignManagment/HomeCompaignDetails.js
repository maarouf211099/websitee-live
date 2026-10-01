const urlParams = new URLSearchParams(window.location.search);
const campaignsId = window.location.search.replace('?compaignId=', '');



$(document).ready(function () {
    var apiUrl = MersalWebAPIBaseUrl + "api/CampaignAPI/GetAllCampaignHomeView";
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: apiUrl,
        async: true,
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (data) {
            DrawCampaginsDetails(data);

            $("#imgAjaxLoader").hide();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
            $("#imgAjaxLoader").hide();
        }
    });
});





function DrawCampaginsDetails(json) {

    debugger
    var Description = `<div class=""> ${_cultureIsArabic ? json[campaignsId].DescriptionAr : json[campaignsId].DescriptionEn}</div>`;
    var campaignsName = ` <h1> ${_cultureIsArabic ? json[campaignsId].TitleAr : json[campaignsId].TitleEn}</h1>`
    $("#campaignsDetalsDiv").html(Description);



    var Mony_wanted_remaining = ` 
    <b class="wanted">   مطلوب :  <span>${ json[campaignsId].RequiredAmount}</span></b>  
    <b class="remaining"> متبقي : <span>${ json[campaignsId].RemainingAmount}</span>   </b> 
    `


    $("#MonyWantedRemaining").html(Mony_wanted_remaining);



    var campaignsImges = "";


    for (var x = 0; x < json[campaignsId].ImagesPathsList.length; x++) {


        var img = `<img src="${json[campaignsId].ImagesPathsList[x]}" alt="" />`;
        campaignsImges += img;

    }
    $("#campaignsImges").html(campaignsImges);
    $("#campaignsName").html(campaignsName);



}