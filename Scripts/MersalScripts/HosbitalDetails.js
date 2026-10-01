
const urlParams = new URLSearchParams(window.location.search);
// const HosbitalId = urlParams.get('HosbitalId');
const HosbitalId=0;
function DrawHosbitalsDetails(json) {
  
    var HosbitalDetals=`<div class=""> ${_cultureIsArabic?json[HosbitalId].ContentAR:json[HosbitalId].ContentEn}</div>`;
    var HosbitalImges=`<img src="${json[HosbitalId].ImagePath}" alt="" />`
    var HosbitalName=` <h1> ${_cultureIsArabic?json[HosbitalId].TitleAR:json[HosbitalId].TitleEN}</h1>`
    $("#HosbitalDetalsDiv").html(HosbitalDetals);
    $("#HosbitalImges").html(HosbitalImges);
    $("#HosbitalName").html(HosbitalName);
      
    
    



}
  

$(document).ready(function () {
    //var Loader = $(document.createElement('img')).attr("src", '/images/loading2.gif').addClass("AjexLoader");
    //$("#loaders").append(Loader);
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: MersalWebAPIBaseUrl + "api/DynamicPages/GetByType?typeCode=MersalHospital",
        //async: false,
        //beforeSend: function () {
        //    $(Loader).show();
        //},
        headers: getHeaders(),
        success: function (data) {
            DrawHosbitalsDetails(data); 

            //$(CasesLoader).hide();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
            //$(Loader).hide();
        }
    });
});