


$(document).ready(function () {

    //list for playlist that contain videos
    var output;
    var maxres = 4;
    var googleApiUrl = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=PL1qS8dUXKkE_f69yoMJb1Dea54fTrkwRF&key=AIzaSyDv7-0deqTbGrllZiJuwl5m61tW9kWYiUo";
    var VideoLoader = $(document.createElement('img')).attr("src", '/images/loading2.gif').addClass("AjexLoader");
    $("#loaders").append(VideoLoader);
    $.ajax({
        type: "GET",
        url: googleApiUrl,
        data: { maxResults: maxres },
        contentType: "application/json",
        beforeSend: function () {
            $(VideoLoader).show();
        },
        success: function (data) {
            if (data.items.length > 0) {
                $("#VideosSection").css('display', 'block');
                $.each(data.items, function (i, item) {
                    output = '<div class="col-md-6 MyVideo"><iframe height="192" width="270" allowfullscreen frameborder="0" src="//www.youtube.com/embed/' + item.snippet.resourceId.videoId + '"></iframe></div>';
                    $("#containerVideos").append(output);
                });
                $(VideoLoader).hide();
            }
        },
        error: function (xhr) {
            toastr.error(xhr.statusText + "List For Playlist That Contain Videos");
            $(VideoLoader).hide();
        }
    });


    // get album footer and home 
    var output = "";
    var footer = "";
    var maxres = 20;
    var GetAlbumURL = MersalWebAPIBaseUrl + "api/Albums/GetLastFourAlbums";
    var AlbumLoader = $(document.createElement('img')).attr("src", '/images/loading2.gif').addClass("AjexLoader");
    $("#loaders").append(AlbumLoader);
    $.ajax({
        type: "GET",
        url: GetAlbumURL,
        data: { maxResults: maxres },
        contentType: "application/json",
        beforeSend: function () {
            AlbumLoader.show();
        },
        success: function (data) {
            if (data != null && data.AlbumHomeViewList != null && data.AlbumHomeViewList.length > 0) {
                $("#AlbumsSection").css('display', 'block');
                var html = "";
                var outputhtml = "";
                var count = 0;
                $.each(data.AlbumHomeViewList, function (i, item) {
                    if (count < 4) {
                        var ablumtitle = item.TitleEn;
                        if (_cultureIsArabic) {
                            ablumtitle = item.TitleAr;
                        }

                        output = '<div class="col-md-6"><div class="product"><div class="product-img albumHomeImg">'
                            + '<img src="' + item.ImagePathThumbnail + '"  /> <a class="albumhome" href="/Album/LastfourAlbumImages/'
                            + item.Id + '">' + ablumtitle + '</a></div></div></div>';

                        $("#albumContainerDiv").append(output);
                        count++;
                    }
                });
                AlbumLoader.hide();

            }
        },
        error: function (xhr) {
            toastr.error(xhr.statusText + "Album Footer And Home");
            AlbumLoader.hide();
        }
    });
});


