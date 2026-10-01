function GetAndDrawMenu(UserID) {
    var apiurl = UserNamagementWebAPIBaseUrl + "api/User/GetMenuItemsByuserIdAndAppID?userId=" + UserID + "&appId=" + 2;
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),

        async: false,
        success: function (data) {
           

            DrawMenu(data)


        },
        error: function (xhr) {
           

        }
    });
}
function DrawMenu(JsonArr) {
     
    var html = '';
    var template = '  <li><a href="Url"><i class="fa fa-link"></i> <span> #Name#</span></a></li> ';
    //html += '<li><a href="/account/AdminProfile"> <i class="fa fa-calendar"></i> <span> ' + profile + ' </span></a></li>'
    //html += '<li><a href="/case/GetAllCaseReminderAssigned"> <i class="fa fa-tasks"></i> <span> ' + DelegateTasks + ' </span></a></li>'
    for (var i = 0; i < JsonArr.length; i++) {
        if (JsonArr[i].ParentId == null) {
            var childarr = GetChildMenu(JsonArr[i].Id, JsonArr);
            if (childarr.length > 0) {
                html += '  <li class="treeview"> <a href="#"><i class="fa fa-link"></i> <span>' + MenuItemNameLoc(JsonArr[i]) + '</span><i class="fa fa-angle-left pull-left"></i> </a>'
                html += ' <ul class="treeview-menu">';
               
                for (var c = 0; c < childarr.length; c++) {
              
                    html += '<li><a id="M' + JsonArr[i].Id + '" href="' + childarr[c].URL + '">' + MenuItemNameLoc(childarr[c]) + '</a></li>';
                }
                html += '</ul>';
            }
            else {
                html += '  <li><a id="M' + JsonArr[i].Id + '" href="' + JsonArr[i].URL + '"><i class="fa fa-link"></i> <span> ' + MenuItemNameLoc(JsonArr[i]) + '</span></a></li> ';
            }
            html += "</li>"
        }

    }
    
    $("#menuHolder").html(html);
    //$("#menuHolder").append(html);
    addOnClickAction();
}
function GetChildMenu(parentId, arr) {
    var childarr = [];
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].ParentId == parentId) {
            childarr.push(arr[i]);

        }
    }

    return childarr;
}

function addOnClickAction() {
    //System Codes
    $("#M1024").on("click", function () { GoToSystemCode(); });
    $("#M1024").removeAttr("href");
    $("#M1024").css("cursor", "pointer");


    //Users Management
    $("#M1025").on("click", function () { GoToUserManagement(); });
    $("#M1025").removeAttr("href");
    $("#M1025").css("cursor", "pointer");
}

function MenuItemNameLoc(item) {
    if (_cultureIsArabic) {
        return item.NameOther;
    }
    else {
        return item.Name;
    }
}