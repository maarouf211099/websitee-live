 

$(document).ready(function () {
    console.log("ContactUs")
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: MersalWebAPIBaseUrl + "api/BrancheDetails/GetAllBranches",
        async: true,
        headers: getHeaders(),
        success: function (data) {
           
            DrawsiteMapBranches(data);
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });

   
});




function DrawsiteMapBranches(json){
  
     var html = ""; 
     
    var template = `
    <li>
    <span class="col-lg-10   seperate">
      <a
        href="https://www.google.com/maps/search/?api=1&query=#latMap#,#lngMap#"
        target="_blank"
        rel="noopener noreferrer"
        >#AddressAR#</a
      >- <span> <a href="tel:+#Tel#"> #Tel# </a></span>
    </span>
     <div class="col-lg-2  seperate">
      <i class="fas fa-map-marker-alt"></i>
     </div>
     
      
    </li>
  
    `;
 
    for (var i = 0; i < json.length; i++) {
 
  
    var res=  template.replaceAll("#AddressAR#", json[i].AddressAR)
    
     .replaceAll("#Tel#", json[i].Tel) 
    .replaceAll("#lngMap#", json[i].lngMap) 
    .replaceAll("#latMap#", json[i].latMap);
     
   
      html += res;
 
    }
 
    $("#BranchessiteMap").html(html);

}


