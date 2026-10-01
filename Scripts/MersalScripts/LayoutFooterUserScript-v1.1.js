

function callDonationpopup(DonationType, perantId, AccountId, NameCode, RemainingVal) {
    $("#DonationDestinationId").rules("remove");

    if (DonationType == 1)//case
    {
        $(".hidCaseIdDonation").val(perantId);
        $(".hidAccountIdDonation").val(AccountId);
        $(".hidDonationType").val('4126');
        $("#caseName_CodeTextDonationPopUp").html(NameCode);
        $("#remainingTextDonationPopUp").html(Remaining + " EGP " + RemainingVal);
        $(".DonationDestinationTypeDiv").css("display", "none");


    }
    else if (DonationType == 2)//general
    {
        $(".hidCaseIdDonation").val(0);
        $(".hidAccountIdDonation").val(0);
        $(".hidDonationType").val('4125');
        $("#caseName_CodeTextDonationPopUp").html("");
        $("#remainingTextDonationPopUp").html("");
        $(".DonationDestinationTypeDiv").css("display", "block");

        $("#DonationDestinationId").rules("add", {
            required: true,
            messages: {
                required: requiredDonationDestination
            }
        });

    }
    else if (DonationType == 3)//Campaigns
    {
        $(".hidCaseIdDonation").val(perantId);
        $(".hidAccountIdDonation").val(AccountId);
        $(".hidDonationType").val('4127');
        $("#caseName_CodeTextDonationPopUp").html(NameCode);
        $("#remainingTextDonationPopUp").html(Remaining + " EGP " + RemainingVal);
        $(".DonationDestinationTypeDiv").css("display", "none");

    }
    else if (DonationType == 4)//Activites
    {
        $(".hidCaseIdDonation").val(perantId);
        $(".hidAccountIdDonation").val(AccountId);
        $(".hidDonationType").val('4131');
        $("#caseName_CodeTextDonationPopUp").html(NameCode);
        $("#remainingTextDonationPopUp").html("");
        $(".DonationDestinationTypeDiv").css("display", "none");

    }
    $(".donation-popup").fadeIn();
    $("body,html").addClass("stop");
    return false;
}
var SetMarkarsMap = [];

$(document).ready(function () {

    /* ============ LAYER SLIDER ================*/
    jQuery("#layerslider").layerSlider({
        responsive: true,
        //responsiveUnder: 1280,
        layersContainer: 1170,
        skin: 'fullwidth',
        hoverPrevNext: true,
        skinsPath: '/Content/layerslider/'

    });


    ///* ============ Welfare Projects Carousel ================*/
    //$('.welfare-projects-carousel').owlCarousel({
    //    autoplay: true,
    //    autoplayTimeout: 2500,
    //    smartSpeed: 2000,
    //    autoplayHoverPause: true,
    //    loop: true,
    //    dots: false,
    //    nav: false,
    //    margin: 0,
    //    mouseDrag: true,
    //    items: 4,
    //    autoHeight: true,
    //    responsive: {
    //        0: { items: 1 },
    //        480: { items: 2 },
    //        768: { items: 3 },
    //        1200: { items: 4 },
    //    }
    //});


    ///* ============ Sponsors Carousel ================*/
    //$('.sponsors-carousel').owlCarousel({
    //    autoplay: true,
    //    autoplayTimeout: 2500,
    //    smartSpeed: 2000,
    //    loop: true,
    //    dots: false,
    //    nav: true,
    //    margin: 10,
    //    mouseDrag: true,
    //    items: 5,
    //    autoHeight: true,
    //    responsive: {
    //        0: { items: 1 },
    //        480: { items: 2 },
    //        768: { items: 3 },
    //        1200: { items: 5 },
    //    }
    //});



    //GetAnyMasterDetalisCodeDatalist('cDis', 'DisesaseType', false, true, "", "medc");
    GetAnyMasterDetalisCode('cDis', 'DisesaseType', false, true, "", "medc");
    GetAnyMasterDetalisCode('cSrv', 'ServiceType', false, true, "", "medc");
    GetAnyMasterDetalisCode('Diag', 'EmergencyServiceType', false, true, "", "",true);
    GetAnyMasterDetalisCode('EmerNeed', 'CoronaForm_NeedId', false, true, "", "");
    GetAnyMasterDetalisCode('EmerCanDrin', 'CoronaForm_CanEatAndDrink', false, true, "", "");
    GetAnyMasterDetalisCode('EmerCurrentLocation', 'CoronaForm_CaseLocationId', false, true, "", "");
    GetAnyMasterDetalisCode('EmerIfCaseInHospital', 'CoronaForm_HospitalLocationId', false, true, "", "",true);
    GetAnyMasterDetalisCode('Orgt', 'OrganizationType', false, true, "", "", true);
    GetAnyMasterDetalisCode('DoDs', 'DonationDestinationId', false, true, "", "", true);
    GetAnyMasterDetalisCode('DoDs', 'DonationDestinationIdd', false, true, "", "", true);
    GetAnyMasterDetalisCode('DoDs', 'BankDonationDestinationId', false, true, "", "", true);
    GetAnyMasterDetalisCode('GEND', 'Gender', false, true, "", "", true);
    GetAnyMasterDetalisCode('STINEGY', 'StatusInEgypt', false, true, "", "", true);
    GetAnyMasterDetalisCode('NAT', 'Nationality', false, true, "", "", true);
    GetAnyMasterDetalisCode('RLG', 'Religion', false, true, "", "", true);



    $('#DonationDestinationId').change(function () {
        console.log("fooooter v1.1");
        $('#DonationSub').hide();
        $('#DonationSubOfSub').hide();

        $('#DonationDestinationSubOfSubId').html('');
        $('#DonationDestinationSubId').html('');

        $("#DonationDestinationSubId").rules("add", {
            required: false,
            messages: {
                required: requiredDonationDestination
            }
        });

        $("#DonationDestinationSubOfSubId").rules("add", {
            required: false,
            messages: {
                required: requiredDonationDestination
            }
        });


        var id = $('#DonationDestinationId').val();
        GetByParentId('DonationDestinationSubId', id,'DonationSub');    
    });

    $('#DonationDestinationSubId').change(function () {
        $('#DonationSubOfSub').hide();
        $('#DonationDestinationSubOfSubId').html('');

        $("#DonationDestinationSubOfSubId").rules("add", {
            required: false,
            messages: {
                required: requiredDonationDestination
            }
        });


        var id = $('#DonationDestinationSubId').val();
        GetByParentId('DonationDestinationSubOfSubId', id,'DonationSubOfSub');
    });



    function GetByParentId(dropDownId, parentId,itemToShow) {
        var url = SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetByParentId?parentId=" + parentId;
        $.ajax({
            type: "GET",
            contentType: "application/json",
            url: url,
            async: true,
            success: function (data) {
                var htmlGovernorate = "<option value=''></option>";
                $.each(data, function (key, value) {
                    htmlGovernorate += "<option value=" + value.Id + " >" + value.NameEn + "</option>";
                });
                $("#" + dropDownId).html(htmlGovernorate);
                if (data.length != 0) {
                    $('#' + itemToShow).show();
                    $("#" + dropDownId).rules("add", {
                        required: true,
                        messages: {
                            required: requiredDonationDestination
                        }
                    });
                }
            },
            error: function (xhr) {
                //toastr.error(xhr.statusText);
            }
        });

    }



    /*=================== DonationSlide ===================*/
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: MersalWebAPIBaseUrl + "api/DonationSlider/GetAllDonationSlider",
        async: true,
        success: function (data) {
            var html = "";
            //var slide = '<div class="unitDonation"><img src="#src#"><strong class="popup-title">#head#</strong><p>#des#</p></div>';
            var slide = '<div class="col-sm-6"><img src="#src#" > <strong class="popup-title" style="">#head#</strong><p>#des#</p></div>';
            $.each(data, function (key, value) {
                if (_cultureIsArabic) {
                    value.Title = value.TitleAr;
                    value.Description = value.DescriptionAr;
                }
                var res = slide.replace("#src#", value.ThumbnailPath)
                    .replace("#head#", value.Title)
                    .replace("#des#", value.Description)
                html += res;
            });
            $("#donationSlide").html(html);
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });

    /*=================== BranchesSlide ===================*/
    $("#DonationsTabs").tabs();

});





