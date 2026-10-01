

function DrawProjects(json) {
  
    var html = ""; 
     
    var template = `
            <div
            class="card col-lg-6 col-md-12 ProjectItem"
            style="background-image: url('#ImagePath#'); background-size: contain; background-repeat: round;">        
            <div class="overlay">
            <h6>`+(_cultureIsArabic?'#TitleAR#' : '#TitleEN#') +`</h6>
            <p>
            `+(_cultureIsArabic?'#ContentAR#': '#ContentEn#' )+`
            </p>
            <a class="btn" href="home/ProjectDetals?projectId=#projectId#"> 
            `+(_cultureIsArabic?'المزيد' : 'More') +` <img class="rotat-en" src="../../images/arrow.png" alt="" />
            </a>
            </div>
          </div>
    `;
 
    for (var i = 0; i < json.length; i++) {
        json[i].ContentAR= json[i].ContentAR.replace(/<[^>]*>?/gm, "")
        .replace(/&nbsp;/g, "").substring(0, 120) + " .... " ;
        
        json[i].ContentEn= json[i].ContentEn.replace(/<[^>]*>?/gm, "")
        .replace(/&nbsp;/g, "").substring(0, 120) + " .... " ;

  if (i<4) {
    var res=  template.replaceAll("#TitleAR#", json[i].TitleAR)
    .replaceAll("#TitleEN#", json[i].TitleEN)       
    .replaceAll("#ImagePath#", json[i].ImagePath)
    .replaceAll("#projectId#", i)
    .replaceAll("#ContentAR#", json[i].ContentAR)
    .replaceAll("#ContentEn#", json[i].ContentEn);
   
      html += res;
  }
    }
 
    $("#ProjectsDiv").html(html);



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
            if (data.length==0) {
                $("#hosbitalDiv").addClass( "display-none" );
            } else {
                DrawProjects(data); 
            }
          
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
            //$(Loader).hide();
        }
    });
});