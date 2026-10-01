

        // `+_cultureIsArabic?'#ContentAR#': '#ContentEn#' +`



function Drawhospital(json) {
  // debugger;
    var template  = ` 
    <div class="row">
    <div class="col-lg-5 col-md-12">
      <div class="title-new">
        <h1> `+(_cultureIsArabic?'#TitleAR#' : '#TitleEN#') +`</h1>
        <span></span>
      </div>

      <div class="description">
        <p>
        `+(_cultureIsArabic?'#ContentAR#': '#ContentEn#' )+`
        </p>
      </div>

      <div class="showMore">
        <a href="home/HosbitalDetals" class="btn">   `+(_cultureIsArabic?'مشاهدة المزيد': 'Show More' )+`  </a>
      </div>
    </div>
    <div class="col-lg-7 col-md-12 imge-section">
      <div>
        <img src="#ImagePath#" alt="" />
        <div class="border"></div>
      </div>
    </div>
  </div>
   `;

   json[0].ContentAR= json[0].ContentAR.replace(/<[^>]*>?/gm, "")
   .replace(/&nbsp;/g, "") ;
   
   json[0].ContentEn= json[0].ContentEn.replace(/<[^>]*>?/gm, "")
   .replace(/&nbsp;/g, "") ;
   
 var  html= template.replaceAll("#TitleAR#", json[0].TitleAR)
                    .replaceAll("#TitleEN#", json[0].TitleEN)       
                    .replaceAll("#ImagePath#", json[0].ImagePath)
                    .replaceAll("#ContentAR#", json[0].ContentAR)
                    .replaceAll("#ContentEn#", json[0].ContentEn);
        
      $("#hosbitalDiv").html(html);
 
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
          // debugger
            
             if (data.length==0) {
               $("#hosbitalDiv").addClass( "display-none" );
             } else {
              Drawhospital(data); 
             }

            //$(CasesLoader).hide();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
            //$(Loader).hide();
        }
    });
});