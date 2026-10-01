var GetAllDonationStatisticsUrl = MersalWebAPIBaseUrl + "api/DonationStatistics/GetByCode?code=TotalCampaignsDonations";
$(function () {
    $.ajax({
        cashe: false,
        url: GetAllDonationStatisticsUrl,
        type: "GET",
        contentType: false,
        processData: false,
        success: function (result) {
        
            let num=result.Value;
            
            $(".numbures .number-unit > h1:eq(0)").text(num);
           $(".numbures .number-unit > h2:eq(0)").text(_cultureIsArabic?result.NameArabic:result.NameEnglish);
            $(".numbures .number-unit > p:eq(0)").text(result.TargetValue+"  جنيه  " )
        },
        error: function (error) {
            toastr.error(error);
        }

    });

    $.ajax({
        type: "GET",
        contentType: "application/json",
        headers: getHeaders(),
        url: MersalWebAPIBaseUrl + "api/DynamicPages/GetByType?typeCode=CampaignsDonations",
        //async: false,
        //beforeSend: function () {
        //    $(Loader).show();
        //},
        success: function (data) {
            $("#donation2Desc").html(_cultureIsArabic?data[0].ContentAR:data[0].ContentEn);

         
           
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
            //$(Loader).hide();
        }
    });
});
