

function DrawProjectsList(json) {
  
    var html = ""; 
     var template= `
     <div class="col-md-4 col-lg-4 float-right">
     <div class="product">
       <div class="product-img ActivityImg">
         <img src="#ImagePath#" alt="" />
         <a href="ProjectDetals?projectId=#projectId#"> `+(_cultureIsArabic?'المزيد' : 'More') +`</a>
       </div>
       <div class="story-Header">
         <h3>
           <a href="">`+(_cultureIsArabic?'#TitleAR#' : '#TitleEN#') +` </a>
         </h3>
       </div>
     
       <div class="story-detail">
         <h3>
           <a href=""> `+(_cultureIsArabic?'#ContentAR#': '#ContentEn#' )+` </a>
         </h3>
       </div>
     </div>
   </div>
   

     `;
 
    for (var i = 0; i < json.length; i++) {
        json[i].ContentAR= json[i].ContentAR.replace(/<[^>]*>?/gm, "")
        .replace(/&nbsp;/g, "").substring(0, 250) + " .... " ;
        
        json[i].ContentEn= json[i].ContentEn.replace(/<[^>]*>?/gm, "")
        .replace(/&nbsp;/g, "").substring(0, 250) + " .... " ;

  //if (i<4) {
    var res=  template.replaceAll("#TitleAR#", json[i].TitleAR)
    .replaceAll("#TitleEN#", json[i].TitleEN)       
    .replaceAll("#ImagePath#", json[i].ImagePath)
    .replaceAll("#projectId#", i)
    .replaceAll("#ContentAR#", json[i].ContentAR)
    .replaceAll("#ContentEn#", json[i].ContentEn);
   
      html += res;
  //}
    }
 
    $("#ProjectCardsList").html(html);



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
            DrawProjectsList(data); 
          
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
            //$(Loader).hide();
        }
    });
});