

var channelName = 'mymusic';
//list for playlist that contain videos
$(document).ready(function () {
    getVideo("");

    $('#loadMore').click(function () {
        var hid = $("#hidnextpage").val();
        getVideo(hid);
    });

    

});
function ViewVedio(id){
    var frameID=id.id;
    var element = document.getElementById(frameID);
    element.classList.add("view-vedio");
     
 }
function getVideo(hid) {
    //https://www.googleapis.com/youtube/v3/search?key={your_key_here}&channelId={channel_id_here}&part=snippet,id&order=date&maxResults=20
    var output = "";
    var maxres = 8;//CAQQAA
    var hidnext = "";
    if (hid) {
        hidnext = hid;
    }


    googleApiUrl = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&";
    googleApiUrl += "playlistId=PL1qS8dUXKkE_f69yoMJb1Dea54fTrkwRF&pageToken=" + hidnext + "&key=AIzaSyDv7-0deqTbGrllZiJuwl5m61tW9kWYiUo";
    $.ajax({
        type: "GET",
        url: googleApiUrl,
        data: { maxResults: maxres },
        contentType: "application/json",
           beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
 
           success: function (data) {
                ;
                $("#imgAjaxLoader").hide();
            $("#hidnextpage").val(data.nextPageToken); 
            $.each(data.items, function (i, item) {
                output =  output = `
                <div class="fields">
                <div style="background-image: url('`+item.snippet.thumbnails.high.url+`');">
                <img src="../../images/PlayVedio.png" alt=""  onclick="ViewVedio(Vedio`+i+`)">
               
                </div>
                <p> `+item.snippet.title.substring(0, 30) + " ... "+`</p>
                  <iframe
                    height="200"
                    width="300"
                    allowfullscreen
                    src="//www.youtube.com/embed/`+item.snippet.resourceId.videoId+`"
                    id="Vedio`+i+`"
                    class=""
                  ></iframe>
                
                 
                
                </div>
                `;
                
                
                
                
                $("#containerVideos").append(output);
            });
            if (!data.nextPageToken) { 
                $(".pagenext").hide();
            } 


        },
        error: function (xhr) {
         $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}



