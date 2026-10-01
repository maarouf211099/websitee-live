function DrawSuponser(json) {
    $("#SponsorScetion").css('display', 'block');
    var html = "";
    var template = '<div class=""><a href="#hrefURL#"><img itemprop="image" src="#imgSrc#" /></a></div>' 
    for (var i = 0; i < json.length; i++) {
        var res = template.replace("#imgSrc#", json[i].ThumbnailPath);

        if (json[i].href) { 
            res = res.replace("#hrefURL#", json[i].href);
        }
        else {
                res = res.replace("#hrefURL#", "");
        }
        html += res;
    }
    $("#suponserContainerDiv").append(html);
} 
 


$(document).ready(function () {
    var urlSpons = MersalWebAPIBaseUrl + "api/Sponsor/GetAllSponsor"
    var SponsorLoader = $(document.createElement('img')).attr("src", '/images/loading2.gif').addClass("AjexLoader");
    $("#loaders").append(SponsorLoader);
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: urlSpons,
        headers: getHeaders(),
        //async: false,
        beforeSend: function () {
            $(SponsorLoader).show();
        },
        success: function (data) {
            if (data.length > 0) {
                DrawSuponser(data);
                /* ============ Sponsors Carousel ================*/
                $('.sponsors-carousel').owlCarousel({
                    autoplay: true,
                    autoplayTimeout: 2500,
                    smartSpeed: 2000,
                    loop: true,
                    dots: false,
                    nav: true,
                    margin: 10,
                    mouseDrag: true,
                    items: 5,
                    //autoHeight: true,
                    responsive: {
                        0: { items: 1 },
                        480: { items: 2 },
                        768: { items: 3 },
                        1200: { items: 5 },
                    }
                });
                $(SponsorLoader).hide();
            } else {
                $('#SponsorScetion').hide();
            }
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
                $(SponsorLoader).hide();
        }
    });
});
