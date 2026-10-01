function GetAndDrawMenu(UserID) {
    var apiurl = UserNamagementWebAPIBaseUrl + "api/User/GetMenuItemsByuserIdAndAppID?userId=" + UserID + "&appId=" + 1;
    $.ajax({
        type: "get",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),
        //async: true,
        success: function (data) {
          
            DrawMenu(data)
        },
        error: function (xhr) {
        


        }
    });
}
function DrawMenu(JsonArr) {
    
    var html = '';
    var htmlResp = ''; 

    for (var i = 0; i < JsonArr.length; i++) {
        if (JsonArr[i].ParentId == null) {
            //if (JsonArr[i].Id != 3074 && JsonArr[i].Id != 2069 && JsonArr[i].Id != 2067 && JsonArr[i].Id != 3089 && JsonArr[i].Id != 1046&& JsonArr[i].Id != 3090) {
            //    continue;
            //}
            var childarr = GetChildMenu(JsonArr[i].Id, JsonArr);
            if (childarr.length > 0) {
                html += '<li class="menu-item-has-children all-demos"> <a href="#">' + MenuItemNameLoc(JsonArr[i]) + '</a><ul>';
                htmlResp += '<li class="menu-item-has-children all-demos"><a itemprop="url" href="" title="">' + MenuItemNameLoc(JsonArr[i]) + '</a><ul>';
                for (var c = 0; c < childarr.length; c++) {
                    // debugger
                    html += '<li><a href="' + childarr[c].URL + '">' + MenuItemNameLoc(childarr[c]) + '</a></li>';
                    htmlResp += '<li  ><a href="' + childarr[c].URL + '">' + MenuItemNameLoc(childarr[c]) + '</a></li>';
                }
                html += '</ul>';
                htmlResp += '</ul></li>';
            }
            else {
                html += '<li class="menu-item"><a href="' + JsonArr[i].URL + '">' + MenuItemNameLoc(JsonArr[i]) + '</a></li>';
                htmlResp += '<li><a href="' + JsonArr[i].URL + '">' + MenuItemNameLoc(JsonArr[i]) + '</a></li>';
            }
            html += "</li>"
        }

    }
    $("#menuHolder").append(html);
    $("#menuListItemResponsive").append(htmlResp);

    $("#responsive-menu .menu-links > ul li.menu-item-has-children > a").on("click", function () {
        $(this).next("ul").slideToggle();
        return false;
    });

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

function MenuItemNameLoc(item) {
    if (_cultureIsArabic) {
        return item.NameOther;
    }
    else {
        return item.Name;
    }
}


 
 