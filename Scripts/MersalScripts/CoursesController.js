function DrawCourses(json) {
    var html = "";
    var template = ' <div class="col-md-3">  '
                    + '    <div class="product" itemscope itemtype="http://schema.org/Product">   '
                       + '     <div class="product-img"><img itemprop="image" src="#imgSrc#" alt="" /><a itemprop="url" href="#href#" title=""><i class="ti-shopping-cart"></i></a></div> '
                         + '   <h4 itemprop="name"><a itemprop="url" href="#DetailsHref#" title="">#title#</a></h4>   '
                          + '  <span itemtype="http://schema.org/Offer" itemscope itemprop="offers"><ins itemprop="price">#price#</ins> </span> '
                     + '   </div> </div>   ';
    for (var i = 0; i < json.length; i++) {
        var res = template
                .replace("#imgSrc#", json[i].imgSrc)
                .replace("#href#", json[i].href)
                .replace("#title#", json[i].title)
                .replace("#price#", json[i].price)
                 .replace("#DetailsHref#", json[i].DetailsHref)

        html += res;
    }

    $("#coursesContainerDiv").html(html);

}
function GetAndDrawCouses(url) {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: url,
        headers: getHeaders(),
        async: false,
        success: function (data) {
            DrawCourses(data)
        },
        error: function (xhr) {
        toastr.error(xhr.statusText);
        }
    });
}