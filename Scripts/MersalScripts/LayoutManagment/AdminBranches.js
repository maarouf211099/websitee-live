var image = '/images/logoToMap.png'; 
var MersalDefultLocation = { lat: 30.270753, lng: 30.975953 };
var markers = [];
function getCreateBranche() {
    $('#CreateBrancheForm').trigger('reset');
    $('#CreateBrancheModals').modal('show');
}

function initializeCreateNewBranche() { 
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 10,
        center: MersalDefultLocation, 
    });

    // This event listener calls addMarker() when the map is clicked.
    google.maps.event.addListener(map, 'click', function (event) {
        addMarkerCreate(event.latLng, map);
    });

    // Add a marker at the center of the map.
    //addMarker(MersalDefultLocation, map);
    //var marker = new google.maps.Marker({
    //    position: MersalDefultLocation,
    //    map: map,
    //    icon: image, 
    //});
    //markers.push(marker);
}

// Adds a marker to the map.
function addMarkerCreate(location, map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
    var marker = new google.maps.Marker({
        position: location, 
        map: map,
        icon: image,
        title: $("#TitleMap").val(),
    });
    markers.push(marker);
    $("#latMapCreate").val(location.lat());
    $("#lngMapCreate").val(location.lng()); 
}

google.maps.event.addDomListener(window, 'load', initializeCreateNewBranche);
 


$(document).ready(function () { 
    var CreateBrancheForm = $("#CreateBrancheForm");
    CreateBrancheForm.submit(function (e) {
        $.validator.unobtrusive.parse(CreateBrancheForm)
        e.preventDefault();
        if (!CreateBrancheForm.valid()) return;
        var url = MersalWebAPIBaseUrl + "api/BrancheDetails/CreateBranche";
        var data = {};
        $("#CreateBrancheForm").serializeArray().map(function (x) { data[x.name] = x.value; });

        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: url,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            beforeSend: function () {
                $("#imgAjaxLoader").show();
            },
            success: function (data) {
                toastr.success(SuccessfulProcess);
                $('#CreateBrancheModals').modal('hide');
                $("#imgAjaxLoader").hide();
            },
            error: function (xhr) {
                toastr.error(xhr.statusText);
                $("#imgAjaxLoader").hide();
            }
        });
    }); 

});



$("#CreateBrancheModals").on("shown.bs.modal", function () { 
    google.maps.event.trigger(map, "resize");
});




function ConfirmDeleteBranche(id) {
    var url = MersalWebAPIBaseUrl + "api/BrancheDetails/DeleteBranche?id=" + id;
    $.ajax({
        type: "POST",
        contentType: "application/json",
        headers: getHeaders(),
        url: url,
        async: false,
        success: function (data) {
            toastr.success(SuccessfulProcess);
            $("[branchId="+id+"]").remove();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}

function DeleteBranche(id) {
    var CallBackFunction = function () { ConfirmDeleteBranche(id); };
    confirmMessageBootstrap(ConfirmDelete, sureDelete, 400, 250, CallBackFunction);
}