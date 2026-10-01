//$("#btnShowMore").on("click", function () {
//    getMoreAlbums();
//});
function getMoreAlbums() {
    var apiurl = MersalWebAPIBaseUrl + "api/Albums/GetAlbumsListView?currantCountOfAlbums=" + $("#CurrantCountOfAlbums").val();
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: apiurl,
        async: true,
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (data) { 
            $("#imgAjaxLoader").hide();
            $("#CurrantCountOfAlbums").val(data.CurrantCountOfAlbums);
            var temp='<div class="col-md-4" style="margin-bottom: 20px;"><div class="story"><a href="/Album/LastfourAlbumImages/#AlbumId#""><div class="story-img" style="height: 200px;">'+'<img src="#ImagePathThumbnail#">'+'</div></a></div><div class="spent-bar"> <span class="price" style="float: right;"><i>#Title#</i></span></div></div>';
            
           
            //var temp = '<div class="col-md-4"><div class="story"><a href="/Album/LastfourAlbumImages/#AlbumId#">';
            //temp += '<div class="story-img" style="height: 250px;"><img src="#ImagePathThumbnail#"></div></a></div>';
            //temp += '<div class="story-detail"><h3 ><a itemprop="url" href="#" title="">#Title#</a></h3></div></div>';
            var html = "";
            $.each(data.AlbumHomeViewList, function (key, value) {
                var AlbumTitle = value.TitleEn;
                if (_cultureIsArabic) {
                    AlbumTitle = value.TitleAr;
                }
                html = temp.replace("#AlbumId#", value.Id).replace("#ImagePathThumbnail#", value.ImagePathThumbnail)
                .replace("#Title#", AlbumTitle);
                $("#casesListDiv").append(html);
            });
           
        },
        error: function (xhr) {
        $("#imgAjaxLoader").hide();
toastr.error(xhr.statusText);
        }
    });
}