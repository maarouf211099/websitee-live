  
$("#btnShowMore").on("click", function () {
    getMoreCases(true);
});

$("#AgeGroup , #StateId").on("change", function () {
    $("#CurrantCountOfCases").val(0);
    getMoreCases(false);
});

$('#caseTextSearch').bind('keypress', function (e) {
    if (e.keyCode == 13) {
        $("#CurrantCountOfCases").val(0);
        getMoreCases(false);
    }
});



function getMoreCases(isAppend) {
    var apiurl = MersalWebAPIBaseUrl + "api/Case/GetCasesListView?ageGroup=" + $("#AgeGroup").val() + "&ServiceIDs=" + $("#serviceIDs").val()
    + "&stateId=" + $("#StateId").val() + "&currantCountOfCases=" + $("#CurrantCountOfCases").val() + "&TextSearch=" + $("#caseTextSearch").val();
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: apiurl,
        async: true,
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (data) {
            $("#CurrantCountOfCases").val(data.CurrantCountOfCases);
            var html = "";
            $.each(data.caseHomeViewList, function (key, value) {
             
                html += `<div class="${key==data.caseHomeViewList.length-2?'float-right ':''} col-md-4"><div class="product"><div class="product-img ActivityImg">`;
                html += '<img src="/ClientFilesLayout/CasesImage/thumbnails/' + value.Id + '.jpg" onerror="this.onerror = null; this.src =&quot;/images/logo_W.png&quot;;">';
                html += '<a href="/Case/CaseView/' + value.Id + '">' + CaseDetails + ' </a></div>';
                html += '<div class="story-Header"> ';
                html += '<h3><a >' +`${_cultureIsArabic? 'كود الحالة ' :'Code'}:: `+ value.Id + '  :: ' + value.CaseName.substring(0, 10)   + ' ... </a></h3></div>';
                html += '<div class="story-detail"><h3><a>' + value.Description.substring(0, 150) + ' ... </a></h3></div>';

                html +='<div class="new-totalCount">';
                html += `   <h6> <span> ${_cultureIsArabic ? 'الهدف' : 'Goal'} : </span> <span>` + value.moneyWanted + ` </span>  </h6>`;

                if (value.remainingText.indexOf("-") !=-1) {
                    html += '<span>0</span>';
                } else {
                    html += `   <h6> <span> ${_cultureIsArabic? ' المتبقي  ' :'Goal'} : </span> <span>` + value.remainingText +` </span>  </h6>`;
 
                } 
                 
                  
                html += '</div></div></div>';
            });
            if (isAppend) {
                $("#casesListDiv").append(html);
            }
            else {
                $("#casesListDiv").html(html);
            }
            $("#imgAjaxLoader").hide();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
            $("#imgAjaxLoader").hide();
        }
    });
}


