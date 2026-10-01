
const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('projectId');

function DrawProjectsDetails(json) {
  
    var ProjectDetals=`<div class=""> ${_cultureIsArabic?json[projectId].ContentAR:json[projectId].ContentEn}</div>`;
    var projectImges=`<img src="${json[projectId].ImagePath}" alt="" />`
    var projectName=` <h1> ${_cultureIsArabic?json[projectId].TitleAR:json[projectId].TitleEN}</h1>`
    $("#ProjectDetalsDiv").html(ProjectDetals);
    $("#projectImges").html(projectImges);
    $("#projectName").html(projectName);
      
    
    



}
 

$(document).ready(function () {
    //var Loader = $(document.createElement('img')).attr("src", '/images/loading2.gif').addClass("AjexLoader");
    //$("#loaders").append(Loader);
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: MersalWebAPIBaseUrl + "api/DynamicPages/GetByType?typeCode=MersalProjects",
        //async: false,
        //beforeSend: function () {
        //    $(Loader).show();
        //},
        headers: getHeaders(),
        success: function (data) {
             
            DrawProjectsDetails(data);
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
            //$(Loader).hide();
        }
    });
});