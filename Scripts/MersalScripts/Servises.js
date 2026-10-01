




$(document).ready(function () {
 
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: MersalWebAPIBaseUrl + "api/DynamicPages/GetByType?typeCode=MersalServices",
        headers: getHeaders(),
        success: function (data) {
            DrawProjectsList(data); 
        //     let x=data;
        //   debugger
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
            
        }
    });
});



function DrawProjectsList(json) {
  
    var html = ""; 
     var template= `
     <div class="col-md-4 col-lg-4 float-right">
     <div class="product">
       <div class="product-img ActivityImg">
         <img src="#ImagePath#" alt="" />
         <a href="servicesDetails?ServicesId=#ServicesId#"> `+(_cultureIsArabic?'المزيد' : 'More') +`</a>
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
    .replaceAll("#ServicesId#", i)
    .replaceAll("#ContentAR#", json[i].ContentAR)
    .replaceAll("#ContentEn#", json[i].ContentEn);
   
      html += res;
  //}
    }
 
    $("#ServicesCardsList").html(html);



}
 
