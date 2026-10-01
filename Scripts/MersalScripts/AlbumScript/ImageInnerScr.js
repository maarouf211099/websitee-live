function getMoreImages(id) {

    var apiurl = MersalWebAPIBaseUrl + "api/Albums/GetImagesInAlbum?albumId=" + id + "&currantCount=" + $("#CurrantCountOfAlbums").val();
  
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
            var temp = '<div class="col-md-3" style="margin-bottom: 3px;">';
             temp +='<div class="story">';
             temp += '<div  style="height: 150px;">';
             temp += '  <a class="example-image-link" href="#ImagePath#" data-lightbox="example-set" data-title="#ImageTitle#"><img style="width:250px; height:150px;" class="example-image" src="#ImagePathThumbnail#" alt="" /></a>';
             temp += ' </div>';
             temp += ' </div>';
             temp += ' </div>';
          //  var temp = '<div class="col-md-3" style="margin-bottom: 20px;"><div class="story"><div  style="height: 200px;"><a class="example-image-link" href="#ImagePath#" data-lightbox="example-set" data-title="#ImageTitle#"><img class="example-image" src="#ImagePathThumbnail#" alt="" /></a></div></div></div>';
           //////// var temp ='<a class="example-image-link" href="#ImagePath#" data-lightbox="example-set" data-title="#ImageTitle#"><img class="example-image" src="#ImagePathThumbnail#" alt="" /></a>';
            //var temp = '<div class="col-md-4"><div class="story"><a href="/Album/LastfourAlbumImages/#AlbumId#">';
            //temp += '<div class="story-img" style="height: 250px;"><img src="#ImagePathThumbnail#"></div></a></div>';
            //temp += '<div class="story-detail"><h3 ><a itemprop="url" href="#" title="">#Title#</a></h3></div></div>';
            var html = "";
            $.each(data.AlbumHomeViewList, function (key, value) {
                var ImageTitle = value.TitleEn;
                if (_cultureIsArabic) {
                    ImageTitle = value.TitleAr;
                }
                html = temp.replace("#ImagePath#", value.ImagePath).replace("#ImagePathThumbnail#", value.ImagePathThumbnail)
                .replace("#ImageTitle#", ImageTitle);
                $("#casesListDiv").append(html);
               
            });
           
        },
        error: function (xhr) {
                $("#imgAjaxLoader").hide();
                toastr.error(xhr.statusText);
        }
    });
}
function getMoreImagesbyadmin(id) {

    var apiurl = MersalWebAPIBaseUrl + "api/Albums/GetImagesInAlbum?albumId=" + id + "&currantCount=" + $("#CurrantCountOfAlbums").val();

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
            //var temp = '<div class="col-md-3" style="margin-bottom: 3px;">';
            //temp += '<div class="story">';
            //temp += '<div  style="height: 150px;">';
            //temp += '  <a class="example-image-link" href="#ImagePath#" data-lightbox="example-set" data-title="#ImageTitle#"><img style="width:250px; height:150px;" class="example-image" src="#ImagePathThumbnail#" alt="" /></a>';
            //temp += ' </div>';
            //temp += ' </div>';
            //temp += ' </div>';
            //******************
            var temp='<div class="col-md-4" style="margin-bottom: 10px;">';
            temp += '<div class="col-md-12">';
            temp += '<a class="example-image-link" href="#ImagePath#" data-lightbox="example-set" data-title="#ImageTitle#"><img width="250" height="150" class="example-image" src="#ImagePathThumbnail#" alt="" /></a>';
          
            temp+='<div class="col-md-6" style="float: none;margin: 0 auto;">';
            temp+='<button onclick="getImageDetails(#ImageId#)" type="button" class="btn btn-info"><i class="fa fa-pencil-square-o"></i></button>';
            temp += '<button onclick="DeleteImage(#ImageId2#)" type="button" class="btn btn-info"><i class="fa fa-trash-o"></i></button>';
            temp += '</div></div></div>';
            //***********************
            //  var temp = '<div class="col-md-3" style="margin-bottom: 20px;"><div class="story"><div  style="height: 200px;"><a class="example-image-link" href="#ImagePath#" data-lightbox="example-set" data-title="#ImageTitle#"><img class="example-image" src="#ImagePathThumbnail#" alt="" /></a></div></div></div>';
            //////// var temp ='<a class="example-image-link" href="#ImagePath#" data-lightbox="example-set" data-title="#ImageTitle#"><img class="example-image" src="#ImagePathThumbnail#" alt="" /></a>';
            //var temp = '<div class="col-md-4"><div class="story"><a href="/Album/LastfourAlbumImages/#AlbumId#">';
            //temp += '<div class="story-img" style="height: 250px;"><img src="#ImagePathThumbnail#"></div></a></div>';
            //temp += '<div class="story-detail"><h3 ><a itemprop="url" href="#" title="">#Title#</a></h3></div></div>';
            var html = "";
            $.each(data.AlbumHomeViewList, function (key, value) {
                var ImageTitle = value.TitleEn;
                if (_cultureIsArabic) {
                    ImageTitle = value.TitleAr;
                }
                html = temp
                    .replace("#ImagePath#", value.ImagePath)
                    .replace("#ImagePathThumbnail#", value.ImagePathThumbnail)
                    .replace("#ImageTitle#", ImageTitle)
                    .replace("#ImageId#", value.Id)
                    .replace("#ImageId2#", value.Id);
                $("#ImageListDiv").append(html);
            });

        },
        error: function (xhr) {
          $("#imgAjaxLoader").hide();
                toastr.error(xhr.statusText);
        }
    });
}