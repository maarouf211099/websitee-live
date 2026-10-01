


$(function () {
    $.ajax({
        type: "GET",
        url: "/Account/getSessionStorage",
        async: false,
        success: function (data) {
            
            if (data.result) {
 
                sessionStorage.setItem("Id", data.Id);
                sessionStorage.setItem("UserName", data.UserName);
                sessionStorage.setItem("MenuItems", data.MenuItems);
                sessionStorage.setItem("Privileges", data.Privileges);
                sessionStorage.setItem("token_type", data.token_type);
                sessionStorage.setItem("Authorization", data.Authorization);
            }
            else {
                sessionStorage.setItem("Id", 0);
            }
            var SessionUserId = sessionStorage.getItem("Id");
            
            GetAndDrawMenu(SessionUserId);
            /*if ("isAdminview" in window) {
                if (SessionUserId != 0 && isAdminview) {
                    SRClient.connect(SessionUserId);
                }
            }*/

        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
});


// get Header  
function getHeaders() {
    var Id = sessionStorage.getItem("Id");
    var headers = {};
    if (Id != 0) {
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Id": sessionStorage.getItem("Id"),
            "MenuItems": sessionStorage.getItem("MenuItems"),
            "Privileges": sessionStorage.getItem("Privileges"),
            "token_type": sessionStorage.getItem("token_type"),
            "Authorization": sessionStorage.getItem("Authorization"),
        };
    }
    else {
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Id": sessionStorage.getItem("Id"),
            "Authorization": "pfpnypKSsJ2yBFQZyj6SE2vJbZocOJgw_rU3bApp92LDNC39sdSwh3CrmR2vBGTRxOQnU3cR7fwNb00XOMydBDasKv5UbYNessrOz3hKkXHQiBK-1ypD5VfMh23vTfKdXwaCbv2sko5OA0BMNZ0RjwF07yICsRm-ZUB_qZJsSdGlqt3R6BmHQvr3l6ElNtASS6kSoDOc4VLZQ_jnhGG705k88FRTF6s3UqpEjusD7VqZNyC6r837ZytsdEzNHZd3I1Krqjeu1W8tf3bzKlpyoy7ds87gaaZbYRbZqbE-hQ3eR4DXg3tBRmuQl1lfz39eCB4R_4loug-6NgypmiB1eWYu2gYxtaSbuvEvX2uxmhKfXJCRoq71_dI9QUbN7ELIYHh6eneJDPzchzO2jQx_2_pc2RNDefrlsvmshTt-JTleI9WgMKPEkofq2BaA6nmpHI4BQrlWI7A81TODBqKi3_39uTOBdzY8YI3ZXUOgAUuGAN44snIGjozdquvZ6qzrh2nlT7-VGbuqTpCeOivAiqkB2yq9UKkPxRkWkiMW0scYWDal4sxYO7s7fsJKDnqxEAjxxpcomZ51M6WCFSOA3AkufEnVhAsseQQR5NXICiL9civIRvAe0vWrGNrdsUvCzQbv22LZzQuSjWKU-aKiv5jj1_I5J9TXbwkIsp349sMf4s96F_4jmilcyQtrlHeUsS4XcdmwNY-UCjQJhvMEwNKPNHvB_HRmtAdLdsh__G6T_hHLoQuUC03AKSBeuJB85LKp6_050KrjE4rQ5Yz6gF_70vzeMJX8VmsLg946Iw3gQYsdnw3jSSgSoZHG2lTSDNT2tut7EZ55Lm6-pr8tT0EmMVvRydlIjK6qdcaRaJkobBf9mWvjij8RCbDg0wP7ZYSIiN6Mha8FASwpWdtm1gxPrxhvOz70S3JsL_o958xm1Y0vVbDysw65DNv_QWuDT1J9dyKhkuEiWUUFmFNONg6NAN6Ek0QYKvaRpN8izoJKwYQK40NkXFkLpxZ-SIsCJustpotCF5IiAIHVqkROPHr9z8hy0eRGImdi0wKtebgBpNeZX0eOFJo3V-N9d09D",
        };
    }
    return headers;
}

function GetAnyMasterDetalisCode(MasterCode, dropDownListId, enableAll, async, selectedId, PerantCode, emptyOption) {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetMasterCodeByMultiCode?masterCode=" + MasterCode,
        async: async,
        headers: getHeaders(),
        success: function (data) {
            var html = "";
            if (enableAll) {
                if (_cultureIsArabic) {
                    html = "<option value='0'>الكل</option>";
                }
                else {
                    html = "<option value='0'>All</option>";
                }
            }
            if (PerantCode) {
                $.each(data, function (key, value) {
                    if (value.Parent) {
                        if (value.Parent.Code == PerantCode) {
                            var selec = "";
                            if (value.masterCodeValue == MasterCode) {
                                if (value.Id == selectedId) selec = " selected='selected' ";
                                if (_cultureIsArabic) {
                                    html += "<option Code=\"" + value.Code + "\" value=" + value.Id + selec + "  >" + value.NameAr + "</option>";
                                }
                                else {
                                    html += "<option Code=\"" + value.Code + "\" value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                                }
                            }
                        }
                    }
                });
            }
            else {
                $.each(data, function (key, value) {
                    var selec = "";
                    if (value.masterCodeValue == MasterCode) {
                        if (value.Id == selectedId) selec = " selected='selected' ";
                        if (_cultureIsArabic) {
                            html += "<option Code=\"" + value.Code + "\" value=" + value.Id + selec + "  >" + value.NameAr + "</option>";
                        }
                        else {
                            html += "<option Code=\"" + value.Code + "\" value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                        }
                    }
                });
            }
            $("#" + dropDownListId).html(html);
            if (emptyOption) {
                $("#" + dropDownListId).prepend("<option value='' selected='selected'></option>");
            }
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}

function GetAnyMasterDetalisCodeDatalist(MasterCode, dropDownListId, enableAll, async, selectedId, PerantCode, emptyOption) {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetMasterCodeByMultiCode?masterCode=" + MasterCode,
        async: async,
        headers: getHeaders(),
        success: function (data) {
            var html = "";
            if (enableAll) {
                if (_cultureIsArabic) {
                    html = "<option data-value='0' value='الكل'></option>";
                }
                else {
                    html = "<option data-value='0' value='All'></option>";
                }
            }
            if (PerantCode) {
                $.each(data, function (key, value) {
                    if (value.Parent.Code == PerantCode) {
                        var selec = "";
                        if (value.masterCodeValue == MasterCode) {
                            if (value.Id == selectedId) selec = " selected='selected' ";
                            if (_cultureIsArabic) {
                                html += "<option Code=" + value.Code + " data-value='" + value.Id + "' value='" + value.NameAr + "' " + selec + " ></option>";
                            }
                            else {
                                html += "<option Code=" + value.Code + " data-value='" + value.Id + "' value='" + value.NameEn + "' " + selec + " ></option>";
                            }
                        }
                    }
                });
            }
            else {
                $.each(data, function (key, value) {
                    var selec = "";
                    if (value.masterCodeValue == MasterCode) {
                        if (value.Id == selectedId) selec = " selected='selected' ";
                        if (_cultureIsArabic) {
                            html += "<option Code=" + value.Code + " data-value=" + value.Id + selec + "value=" + value.NameAr + " ></option>";
                        }
                        else {
                            html += "<option Code=" + value.Code + " data-value=" + value.Id + selec + "value=" + value.NameEn + " ></option>";
                        }
                    }
                });
            }
            $("#" + dropDownListId).html(html);
            if (emptyOption) {
                $("#" + dropDownListId).prepend("<option data-value='0' value='' selected='selected'></option>");
            }
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}




var today = new Date();
var dd = today.getDate();
var mm = today.getMonth() + 1; //January is 0!
var yyyy = today.getFullYear();
var myDateNow = dd + '/' + mm + '/' + yyyy;

String.prototype.toDate = function (format, delimiter) {
    var date = this;
    var formatedDate = null;
    var formatLowerCase = format.toLowerCase();
    var formatItems = formatLowerCase.split(delimiter);
    var dateItems = date.split(delimiter);
    var monthIndex = formatItems.indexOf("mm");
    var monthNameIndex = formatItems.indexOf("mmm");
    var dayIndex = formatItems.indexOf("dd");
    var yearIndex = formatItems.indexOf("yyyy");
    var d = dateItems[dayIndex];
    if (d < 10) {
        d = "0" + d;
    }
    if (monthIndex > -1) {
        var month = parseInt(dateItems[monthIndex]);
        month -= 1;
        if (month < 10) {
            month = "0" + month;
        }
        formatedDate = new Date(dateItems[yearIndex], month, d);
    } else if (monthNameIndex > -1) {
        var monthName = dateItems[monthNameIndex];
        month = getMonthIndex(monthName);
        if (month < 10) {
            month = "0" + month;
        }
        formatedDate = new Date(dateItems[yearIndex], month, d);
    }
    return formatedDate;
};

function getMonthIndex(name) {
    name = name.toLowerCase();
    if (name == "jan" || name == "january") {
        return 0;
    } else if (name == "feb" || name == "february") {
        return 1;
    } else if (name == "mar" || name == "march") {
        return 2;
    } else if (name == "apr" || name == "april") {
        return 3;
    } else if (name == "may" || name == "may") {
        return 4;
    } else if (name == "jun" || name == "june") {
        return 5;
    } else if (name == "jul" || name == "july") {
        return 6;
    } else if (name == "aug" || name == "august") {
        return 7;
    } else if (name == "sep" || name == "september") {
        return 8;
    } else if (name == "oct" || name == "october") {
        return 9;
    } else if (name == "nov" || name == "november") {
        return 10;
    } else if (name == "dec" || name == "december") {
        return 11;
    }
}



function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};


Array.prototype.deleteElem = function (val) {
    var index = this.indexOf(val);
    if (index >= 0) this.splice(index, 1);
    return this;
};


function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}


function copyToClipboard(elem) {
    // create hidden text element, if it doesn't already exist
    var targetId = "_hiddenCopyText_";
    var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
    var origSelectionStart, origSelectionEnd;
    if (isInput) {
        // can just use the original source element for the selection and copy
        target = elem;
        origSelectionStart = elem.selectionStart;
        origSelectionEnd = elem.selectionEnd;
    } else {
        // must use a temporary form element for the selection and copy
        target = document.getElementById(targetId);
        if (!target) {
            var target = document.createElement("textarea");
            target.style.position = "absolute";
            target.style.left = "-9999px";
            target.style.top = "0";
            target.id = targetId;
            document.body.appendChild(target);
        }
        target.textContent = elem.textContent;
    }
    // select the content
    var currentFocus = document.activeElement;
    target.focus();
    target.setSelectionRange(0, target.value.length);

    // copy the selection
    var succeed;
    try {
        succeed = document.execCommand("copy");
    } catch (e) {
        succeed = false;
    }
    // restore original focus
    if (currentFocus && typeof currentFocus.focus === "function") {
        currentFocus.focus();
    }

    if (isInput) {
        // restore prior selection
        elem.setSelectionRange(origSelectionStart, origSelectionEnd);
    } else {
        // clear temporary content
        target.textContent = "";
    }
    return succeed;
}





function copyToClipboard2(elem) {
    // create hidden text element, if it doesn't already exist
    var targetId = "_hiddenCopyText_";
    var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
    var origSelectionStart, origSelectionEnd;
    if (isInput) {
        // can just use the original source element for the selection and copy
        target = elem;
        origSelectionStart = elem.selectionStart;
        origSelectionEnd = elem.selectionEnd;
    } else {
        // must use a temporary form element for the selection and copy
        target = document.getElementById(targetId);
        if (!target) {
            var target = document.createElement("textarea");
            target.style.position = "absolute";
            target.style.left = "-9999px";
            target.style.top = "0";
            target.style.visibility = "visible";
            target.id = targetId;
            document.body.appendChild(target);
        }
        target.style.visibility = "visible";
        var cutSpace = elem.textContent.replace(/                                /g, ''); //spicalCase please remove it if you don't want
        target.textContent = cutSpace;
    }
    // select the content
    var currentFocus = document.activeElement;
    target.focus();
    // target.style.visibility = "visible";
    target.setSelectionRange(0, target.value.length);

    // copy the selection
    var succeed;
    try {
        succeed = document.execCommand("copy");
    } catch (e) {
        succeed = false;
    }
    // restore original focus
    if (currentFocus && typeof currentFocus.focus === "function") {
        currentFocus.focus();
    }

    if (isInput) {
        // restore prior selection
        elem.setSelectionRange(origSelectionStart, origSelectionEnd);
    } else {
        // clear temporary content
        target.textContent = "";
    }
    target.style.visibility = "hidden";
    return succeed;
}