

function getMasterAfia() {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: MersalWebAPIBaseUrl + "api/MasterAfia/getlookup",
        async: true,
        success: function (data) {
           
            var htmlDrp = "";
            $.each(data, function (key, value) {
                var selec = "";
                if (value.Icon == "" || value.Icon == null || value.Icon == undefined) {
                    value.Icon ="/images/hospital.png"
                }
                if (_cultureIsArabic) {
                    htmlDrp += "<a class='col-md-4 ' href='AfiaDetails?masterId=" + value.Id +"'><div class='box-new ' ><img src='" + value.Icon + "'>" + "<h5>" + value.NameAr + "</h5>" +"</div> </a>";
                }
                else {
                    htmlDrp += "<a class='col-md-4' href='AfiaDetails?masterId=" + value.Id + "'><div class='box-new' ><img src='" + value.Icon + "'>" + "<h5>" + value.NameEn + "</h5>" + "</div> </a>";
                }
            });
            $(".MasterAfia").append(htmlDrp);
          
        },
        error: function (xhr) {
            toastr.error(xhr.error);
        }
    });
}

function getMasterCode() {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: MersalWebAPIBaseUrl + "api/MasterAfia/getlookup",
        async: true,
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (data) {
            var htmlDrp = "";
            if (_cultureIsArabic) {
                htmlDrp += "<option disabled value='null'>خدمه</option>";
            }
            else {
                htmlDrp += "<option disabled value='null'>Service</option>";
            }
            $.each(data, function (key, value) {
                var selec = "";
                if (_cultureIsArabic) {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                }
                else {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                }
            });
            $(".MasterAfia").append(htmlDrp);
            $('.MasterAfia').change(e => {
                getsubspecialty()
                getRegions($('.goverments').val())
            })
            searchstart();
            $("#imgAjaxLoader").hide();

        },
        error: function (xhr) {
            toastr.error(xhr.error);
            $("#imgAjaxLoader").hide();
        }
    });
}

function search() {
    var addDetailAfiaForm = $("#SearchAfiaForm" + (_cultureIsArabic ? "rtl" : "ltr"));
    addDetailAfiaForm.submit(function (e) {
        e.preventDefault();
        var newDetailAfia = {};
        addDetailAfiaForm.serializeArray().map(function (x) { newDetailAfia[x.name] = x.value; });
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: MersalWebAPIBaseUrl + "api/DetailAfia/searchlist",
            async: true,
            data: JSON.stringify(newDetailAfia),
            beforeSend: function () {
                $("#imgAjaxLoader").show();
            },
            success: function (data) {

                var htmlDrp = "";
                $.each(data, function (key, value) {
                    var selec = "";
                    if (_cultureIsArabic) {
                        htmlDrp +="<div class='col-md-4 '><div class='afya-card' >"
                        if (value.Provider != null && value.Provider != undefined && value.Provider != "") {


                            htmlDrp += "<h5>" + value.Provider + "</h5>";
                        }
                        htmlDrp +=" <div class='d-flex gap-2' >"
                        if (value.MasterNameAr != null && value.MasterNameAr != undefined && value.MasterNameAr != "") {

                            htmlDrp += "<h6 class='afya-type'>" + value.MasterNameAr + "</h6>"
                        }
                        if (value.SpecializationAr != null && value.SpecializationAr != undefined && value.SpecializationAr != "") {

                            htmlDrp += "<h6 class='card-specialization'> " + value.SpecializationAr + "</h6>"
                        }
                        htmlDrp +=" </div ><hr />"
                         if (value.Phone1 != null && value.Phone1 != undefined && value.Phone1 != "") {
                             if (value.Phone2 != null && value.Phone2 != undefined && value.Phone2 != "") {
                                 htmlDrp += "<div class='card-phone'><svg xmlns = 'http://www.w3.org/2000/svg' version = '1.1' xmlns: xlink = 'http://www.w3.org/1999/xlink' xmlns: svgjs = 'http://svgjs.com/svgjs' x = '0' y = '0' viewBox = '0 0 512 512' style = 'enable-background:new 0 0 512 512' xml: space = 'preserve' class='' > <g> <circle cx='256' cy='256' r='256' fill='#008080' data-original='#2196f3'></circle><path fill='#FFFFFF' fill-rule='evenodd' d='m412.424 349.946-.273.688c-2.577 6.578-5.166 13.149-7.88 19.677-2.331 5.61-4.743 11.241-7.408 16.7-1.593 3.26-4.116 8.409-6.676 10.969a51.473 51.473 0 0 1-8.588 6.928c-17.86 11.431-40.186 9.82-59.813 4.557-84.306-22.585-196.673-134.952-219.26-219.257-5.26-19.633-6.868-41.965 4.574-59.825a50.861 50.861 0 0 1 6.914-8.577c2.557-2.56 7.712-5.082 10.969-6.675 5.465-2.665 11.1-5.077 16.71-7.408 6.525-2.7 13.1-5.3 19.673-7.88l.685-.264a15.416 15.416 0 0 1 19.044 6.655l32.593 56.466a15.517 15.517 0 0 1-5.66 21.128c-11.529 6.661-20.727 17.023-23.444 30.311a44.606 44.606 0 0 0 8.22 36.581 347.09 347.09 0 0 0 32.12 36.355 347.2 347.2 0 0 0 36.363 32.125 44.586 44.586 0 0 0 36.584 8.221c13.276-2.714 23.65-11.918 30.306-23.447a15.508 15.508 0 0 1 21.122-5.66l56.46 32.6a15.413 15.413 0 0 1 6.665 19.032z' data-original='#ffffff'></path></g></svg ><span class='card-phone'> <a style='color:#000' href='tel:" + value.Phone1 + "'>" + value.Phone1 + "</a> --<a style='color:#000' href='tel:" + value.Phone2 + "'>" + value.Phone2 + "</a></span></div>"

                             //    htmlDrp += "<a class='card-phone' href='tel:"+value.Phone1+"'><svg xmlns = 'http://www.w3.org/2000/svg' version = '1.1' xmlns: xlink = 'http://www.w3.org/1999/xlink' xmlns: svgjs = 'http://svgjs.com/svgjs' x = '0' y = '0' viewBox = '0 0 512 512' style = 'enable-background:new 0 0 512 512' xml: space = 'preserve' class='' > <g> <circle cx='256' cy='256' r='256' fill='#008080' data-original='#2196f3'></circle><path fill='#FFFFFF' fill-rule='evenodd' d='m412.424 349.946-.273.688c-2.577 6.578-5.166 13.149-7.88 19.677-2.331 5.61-4.743 11.241-7.408 16.7-1.593 3.26-4.116 8.409-6.676 10.969a51.473 51.473 0 0 1-8.588 6.928c-17.86 11.431-40.186 9.82-59.813 4.557-84.306-22.585-196.673-134.952-219.26-219.257-5.26-19.633-6.868-41.965 4.574-59.825a50.861 50.861 0 0 1 6.914-8.577c2.557-2.56 7.712-5.082 10.969-6.675 5.465-2.665 11.1-5.077 16.71-7.408 6.525-2.7 13.1-5.3 19.673-7.88l.685-.264a15.416 15.416 0 0 1 19.044 6.655l32.593 56.466a15.517 15.517 0 0 1-5.66 21.128c-11.529 6.661-20.727 17.023-23.444 30.311a44.606 44.606 0 0 0 8.22 36.581 347.09 347.09 0 0 0 32.12 36.355 347.2 347.2 0 0 0 36.363 32.125 44.586 44.586 0 0 0 36.584 8.221c13.276-2.714 23.65-11.918 30.306-23.447a15.508 15.508 0 0 1 21.122-5.66l56.46 32.6a15.413 15.413 0 0 1 6.665 19.032z' data-original='#ffffff'></path></g></svg ><span> " + value.Phone1 + " --" + value.Phone2 + "</span></a>"
                             } else {

                                 htmlDrp += "<a class='card-phone' href='tel:" + value.Phone1 +"'><svg xmlns = 'http://www.w3.org/2000/svg' version = '1.1' xmlns: xlink = 'http://www.w3.org/1999/xlink' xmlns: svgjs = 'http://svgjs.com/svgjs' x = '0' y = '0' viewBox = '0 0 512 512' style = 'enable-background:new 0 0 512 512' xml: space = 'preserve' class='' > <g> <circle cx='256' cy='256' r='256' fill='#008080' data-original='#2196f3'></circle><path fill='#FFFFFF' fill-rule='evenodd' d='m412.424 349.946-.273.688c-2.577 6.578-5.166 13.149-7.88 19.677-2.331 5.61-4.743 11.241-7.408 16.7-1.593 3.26-4.116 8.409-6.676 10.969a51.473 51.473 0 0 1-8.588 6.928c-17.86 11.431-40.186 9.82-59.813 4.557-84.306-22.585-196.673-134.952-219.26-219.257-5.26-19.633-6.868-41.965 4.574-59.825a50.861 50.861 0 0 1 6.914-8.577c2.557-2.56 7.712-5.082 10.969-6.675 5.465-2.665 11.1-5.077 16.71-7.408 6.525-2.7 13.1-5.3 19.673-7.88l.685-.264a15.416 15.416 0 0 1 19.044 6.655l32.593 56.466a15.517 15.517 0 0 1-5.66 21.128c-11.529 6.661-20.727 17.023-23.444 30.311a44.606 44.606 0 0 0 8.22 36.581 347.09 347.09 0 0 0 32.12 36.355 347.2 347.2 0 0 0 36.363 32.125 44.586 44.586 0 0 0 36.584 8.221c13.276-2.714 23.65-11.918 30.306-23.447a15.508 15.508 0 0 1 21.122-5.66l56.46 32.6a15.413 15.413 0 0 1 6.665 19.032z' data-original='#ffffff'></path></g></svg ><span> " + value.Phone1 + "</span></a>"
                             }
                        }
                       
                        if (value.Address != null && value.Address != undefined && value.Address != "") {

                            htmlDrp += "<a  href='https://goo.gl/maps/t6UpALWeNm1riyRc6'> <div class='card-address' ><svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:svgjs='http://svgjs.com/svgjs' x='0' y='0' viewBox='0 0 512 512' style='enable-background:new 0 0 512 512' xml:space='preserve' class=''><g><path d='M256 112c-56.248 0-89.832 35.16-89.832 94.048 0 33.512 44.528 110.936 89.816 172.752 45.016-62.024 89.848-138.488 89.848-172.752C345.832 147.16 312.248 112 256 112zm-.096 134.344c-21.792 0-39.456-17.664-39.456-39.456s17.664-39.456 39.456-39.456 39.456 17.664 39.456 39.456-17.664 39.456-39.456 39.456z' fill='#008080' data-original='#000000' class=''></path><path d='M256 0C114.616 0 0 114.616 0 256s114.616 256 256 256 256-114.616 256-256S397.384 0 256 0zm14.992 412.32L256 432l-14.904-19.68c-10.968-14.336-106.928-142.448-106.928-206.272C134.168 129.48 181.96 80 256 80s121.832 49.48 121.832 126.048c0 63.728-95.968 191.84-106.84 206.272z' fill='#008080' data-original='#000000' class=''></path></g></svg> <span> " + value.GovermentAr + "-" + value.RegionAr + "-" + value.Address + "</span> </div></a>";
                        }
                        if (value.Discounts != null && value.Discounts != undefined && value.Discounts != "") {

                            htmlDrp += "<div class='card-discount'>" + value.Discounts + "</div >";
                        }
                        if (value.RegistraionCode != null && value.RegistraionCode != undefined && value.RegistraionCode != "") {

                            htmlDrp += "<h6 class='serial-num'> الرقم التسلسلي :" + value.RegistraionCode + "</h6>";
                        }
                        htmlDrp +="</div></div>"
                    }
                    else {

                        htmlDrp += "<div class='col-md-4 '><div class='afya-card' >"
                        if (value.Provider != null && value.Provider != undefined && value.Provider != "") {


                            htmlDrp += "<h5>" + value.Provider + "</h5>";
                        }
                        htmlDrp += " <div class='d-flex gap-2' >"
                        if (value.MasterNameEn != null && value.MasterNameEn != undefined && value.MasterNameEn != "") {

                            htmlDrp += "<h6 class='afya-type'>" + value.MasterNameEn + "</h6>"
                        }
                        if (value.SpecializationEn != null && value.SpecializationEn != undefined && value.SpecializationEn != "") {

                            htmlDrp += "<h6 class='card-specialization'> " + value.SpecializationEn + "</h6>"
                        }
                        htmlDrp += " </div ><hr />"
                        if (value.Phone1 != null && value.Phone1 != undefined && value.Phone1 != "") {
                            if (value.Phone2 != null && value.Phone2 != undefined && value.Phone2 != "") {

                                htmlDrp += "<div class='card-phone'><svg xmlns = 'http://www.w3.org/2000/svg' version = '1.1' xmlns: xlink = 'http://www.w3.org/1999/xlink' xmlns: svgjs = 'http://svgjs.com/svgjs' x = '0' y = '0' viewBox = '0 0 512 512' style = 'enable-background:new 0 0 512 512' xml: space = 'preserve' class='' > <g> <circle cx='256' cy='256' r='256' fill='#008080' data-original='#2196f3'></circle><path fill='#FFFFFF' fill-rule='evenodd' d='m412.424 349.946-.273.688c-2.577 6.578-5.166 13.149-7.88 19.677-2.331 5.61-4.743 11.241-7.408 16.7-1.593 3.26-4.116 8.409-6.676 10.969a51.473 51.473 0 0 1-8.588 6.928c-17.86 11.431-40.186 9.82-59.813 4.557-84.306-22.585-196.673-134.952-219.26-219.257-5.26-19.633-6.868-41.965 4.574-59.825a50.861 50.861 0 0 1 6.914-8.577c2.557-2.56 7.712-5.082 10.969-6.675 5.465-2.665 11.1-5.077 16.71-7.408 6.525-2.7 13.1-5.3 19.673-7.88l.685-.264a15.416 15.416 0 0 1 19.044 6.655l32.593 56.466a15.517 15.517 0 0 1-5.66 21.128c-11.529 6.661-20.727 17.023-23.444 30.311a44.606 44.606 0 0 0 8.22 36.581 347.09 347.09 0 0 0 32.12 36.355 347.2 347.2 0 0 0 36.363 32.125 44.586 44.586 0 0 0 36.584 8.221c13.276-2.714 23.65-11.918 30.306-23.447a15.508 15.508 0 0 1 21.122-5.66l56.46 32.6a15.413 15.413 0 0 1 6.665 19.032z' data-original='#ffffff'></path></g></svg ><span class='card-phone'> <a style='color:#000' href='tel:" + value.Phone1 + "'>" + value.Phone1 + "</a> --<a style='color:#000' href='tel:" + value.Phone2 + "'>" + value.Phone2 + "</a></span></div>"
                            } else {

                                htmlDrp += "<a class='card-phone' href='tel:" + value.Phone1 + "'><svg xmlns = 'http://www.w3.org/2000/svg' version = '1.1' xmlns: xlink = 'http://www.w3.org/1999/xlink' xmlns: svgjs = 'http://svgjs.com/svgjs' x = '0' y = '0' viewBox = '0 0 512 512' style = 'enable-background:new 0 0 512 512' xml: space = 'preserve' class='' > <g> <circle cx='256' cy='256' r='256' fill='#008080' data-original='#2196f3'></circle><path fill='#FFFFFF' fill-rule='evenodd' d='m412.424 349.946-.273.688c-2.577 6.578-5.166 13.149-7.88 19.677-2.331 5.61-4.743 11.241-7.408 16.7-1.593 3.26-4.116 8.409-6.676 10.969a51.473 51.473 0 0 1-8.588 6.928c-17.86 11.431-40.186 9.82-59.813 4.557-84.306-22.585-196.673-134.952-219.26-219.257-5.26-19.633-6.868-41.965 4.574-59.825a50.861 50.861 0 0 1 6.914-8.577c2.557-2.56 7.712-5.082 10.969-6.675 5.465-2.665 11.1-5.077 16.71-7.408 6.525-2.7 13.1-5.3 19.673-7.88l.685-.264a15.416 15.416 0 0 1 19.044 6.655l32.593 56.466a15.517 15.517 0 0 1-5.66 21.128c-11.529 6.661-20.727 17.023-23.444 30.311a44.606 44.606 0 0 0 8.22 36.581 347.09 347.09 0 0 0 32.12 36.355 347.2 347.2 0 0 0 36.363 32.125 44.586 44.586 0 0 0 36.584 8.221c13.276-2.714 23.65-11.918 30.306-23.447a15.508 15.508 0 0 1 21.122-5.66l56.46 32.6a15.413 15.413 0 0 1 6.665 19.032z' data-original='#ffffff'></path></g></svg ><span> " + value.Phone1 + "</span></a>"
                            }
                        }

                        if (value.Address != null && value.Address != undefined && value.Address != "") {

                            htmlDrp += "<a  href='https://goo.gl/maps/t6UpALWeNm1riyRc6'> <div class='card-address' ><svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:svgjs='http://svgjs.com/svgjs' x='0' y='0' viewBox='0 0 512 512' style='enable-background:new 0 0 512 512' xml:space='preserve' class=''><g><path d='M256 112c-56.248 0-89.832 35.16-89.832 94.048 0 33.512 44.528 110.936 89.816 172.752 45.016-62.024 89.848-138.488 89.848-172.752C345.832 147.16 312.248 112 256 112zm-.096 134.344c-21.792 0-39.456-17.664-39.456-39.456s17.664-39.456 39.456-39.456 39.456 17.664 39.456 39.456-17.664 39.456-39.456 39.456z' fill='#008080' data-original='#000000' class=''></path><path d='M256 0C114.616 0 0 114.616 0 256s114.616 256 256 256 256-114.616 256-256S397.384 0 256 0zm14.992 412.32L256 432l-14.904-19.68c-10.968-14.336-106.928-142.448-106.928-206.272C134.168 129.48 181.96 80 256 80s121.832 49.48 121.832 126.048c0 63.728-95.968 191.84-106.84 206.272z' fill='#008080' data-original='#000000' class=''></path></g></svg> <span> " + value.GovermentEn + "-" + value.RegionEn + "-" + value.Address + "</span> </div></a>";
                        }
                        if (value.Discounts != null && value.Discounts != undefined && value.Discounts != "") {

                            htmlDrp += "<div class='card-discount'>" + value.Discounts + "</div >";
                        }
                        if (value.RegistraionCode != null && value.RegistraionCode != undefined && value.RegistraionCode != "") {

                            htmlDrp += "<h6 class='serial-num'> Serial Number: " + value.RegistraionCode + "</h6>";
                        }
                        htmlDrp += "</div></div>"
                    }
                });
                $(".SearchAfiaCards" ).empty();
                $(".SearchAfiaCards" ).append(htmlDrp);

                $("#imgAjaxLoader").hide();
            },
            error: function (xhr) {
                toastr.error(xhr.error);
                $("#imgAjaxLoader").hide();
            }
        });
    });
}


function searchstart() {



    const urlParams = new URLSearchParams(window.location.search);
    const param_x = urlParams.get('masterId');
    
    $('.MasterAfia').val(param_x);

    var addDetailAfiaForm = $("#SearchAfiaForm" + (_cultureIsArabic ? "rtl" : "ltr"));


    var newDetailAfia = {};

        addDetailAfiaForm.serializeArray().map(function (x) { newDetailAfia[x.name] = x.value; });
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: MersalWebAPIBaseUrl + "api/DetailAfia/searchlist",
            async: true,
            data: JSON.stringify(newDetailAfia),
            beforeSend: function () {
                $("#imgAjaxLoader").show();
            },
            success: function (data) {
                var htmlDrp = "";
                $.each(data, function (key, value) {
                    
                    var selec = "";
                    if (_cultureIsArabic) {
                        htmlDrp += "<div class='col-md-4 '><div class='afya-card' >"
                        if (value.Provider != null && value.Provider != undefined && value.Provider != "") {


                            htmlDrp += "<h5>" + value.Provider + "</h5>";
                        }
                        htmlDrp += " <div class='d-flex gap-2' >"
                        if (value.MasterNameAr != null && value.MasterNameAr != undefined && value.MasterNameAr != "") {

                            htmlDrp += "<h6 class='afya-type'>" + value.MasterNameAr + "</h6>"
                        }
                        if (value.SpecializationAr != null && value.SpecializationAr != undefined && value.SpecializationAr != "") {

                            htmlDrp += "<h6 class='card-specialization'> " + value.SpecializationAr + "</h6>"
                        }
                        htmlDrp += " </div ><hr />"
                        if (value.Phone1 != null && value.Phone1 != undefined && value.Phone1 != "") {
                            if (value.Phone2 != null && value.Phone2 != undefined && value.Phone2 != "") {
                                htmlDrp += "<div class='card-phone'><svg xmlns = 'http://www.w3.org/2000/svg' version = '1.1' xmlns: xlink = 'http://www.w3.org/1999/xlink' xmlns: svgjs = 'http://svgjs.com/svgjs' x = '0' y = '0' viewBox = '0 0 512 512' style = 'enable-background:new 0 0 512 512' xml: space = 'preserve' class='' > <g> <circle cx='256' cy='256' r='256' fill='#008080' data-original='#2196f3'></circle><path fill='#FFFFFF' fill-rule='evenodd' d='m412.424 349.946-.273.688c-2.577 6.578-5.166 13.149-7.88 19.677-2.331 5.61-4.743 11.241-7.408 16.7-1.593 3.26-4.116 8.409-6.676 10.969a51.473 51.473 0 0 1-8.588 6.928c-17.86 11.431-40.186 9.82-59.813 4.557-84.306-22.585-196.673-134.952-219.26-219.257-5.26-19.633-6.868-41.965 4.574-59.825a50.861 50.861 0 0 1 6.914-8.577c2.557-2.56 7.712-5.082 10.969-6.675 5.465-2.665 11.1-5.077 16.71-7.408 6.525-2.7 13.1-5.3 19.673-7.88l.685-.264a15.416 15.416 0 0 1 19.044 6.655l32.593 56.466a15.517 15.517 0 0 1-5.66 21.128c-11.529 6.661-20.727 17.023-23.444 30.311a44.606 44.606 0 0 0 8.22 36.581 347.09 347.09 0 0 0 32.12 36.355 347.2 347.2 0 0 0 36.363 32.125 44.586 44.586 0 0 0 36.584 8.221c13.276-2.714 23.65-11.918 30.306-23.447a15.508 15.508 0 0 1 21.122-5.66l56.46 32.6a15.413 15.413 0 0 1 6.665 19.032z' data-original='#ffffff'></path></g></svg ><span class='card-phone'> <a style='color:#000' href='tel:" + value.Phone1 + "'>" + value.Phone1 + "</a> --<a style='color:#000' href='tel:" + value.Phone2 + "'>" + value.Phone2 + "</a></span></div>"

                            //    htmlDrp += "<a class='card-phone' href='tel:" + value.Phone1 + "'><svg xmlns = 'http://www.w3.org/2000/svg' version = '1.1' xmlns: xlink = 'http://www.w3.org/1999/xlink' xmlns: svgjs = 'http://svgjs.com/svgjs' x = '0' y = '0' viewBox = '0 0 512 512' style = 'enable-background:new 0 0 512 512' xml: space = 'preserve' class='' > <g> <circle cx='256' cy='256' r='256' fill='#008080' data-original='#2196f3'></circle><path fill='#FFFFFF' fill-rule='evenodd' d='m412.424 349.946-.273.688c-2.577 6.578-5.166 13.149-7.88 19.677-2.331 5.61-4.743 11.241-7.408 16.7-1.593 3.26-4.116 8.409-6.676 10.969a51.473 51.473 0 0 1-8.588 6.928c-17.86 11.431-40.186 9.82-59.813 4.557-84.306-22.585-196.673-134.952-219.26-219.257-5.26-19.633-6.868-41.965 4.574-59.825a50.861 50.861 0 0 1 6.914-8.577c2.557-2.56 7.712-5.082 10.969-6.675 5.465-2.665 11.1-5.077 16.71-7.408 6.525-2.7 13.1-5.3 19.673-7.88l.685-.264a15.416 15.416 0 0 1 19.044 6.655l32.593 56.466a15.517 15.517 0 0 1-5.66 21.128c-11.529 6.661-20.727 17.023-23.444 30.311a44.606 44.606 0 0 0 8.22 36.581 347.09 347.09 0 0 0 32.12 36.355 347.2 347.2 0 0 0 36.363 32.125 44.586 44.586 0 0 0 36.584 8.221c13.276-2.714 23.65-11.918 30.306-23.447a15.508 15.508 0 0 1 21.122-5.66l56.46 32.6a15.413 15.413 0 0 1 6.665 19.032z' data-original='#ffffff'></path></g></svg ><span> " + value.Phone1 + " --" + value.Phone2 + "</span></a>"
                            } else {

                                htmlDrp += "<a class='card-phone' href='tel:" + value.Phone1 + "'><svg xmlns = 'http://www.w3.org/2000/svg' version = '1.1' xmlns: xlink = 'http://www.w3.org/1999/xlink' xmlns: svgjs = 'http://svgjs.com/svgjs' x = '0' y = '0' viewBox = '0 0 512 512' style = 'enable-background:new 0 0 512 512' xml: space = 'preserve' class='' > <g> <circle cx='256' cy='256' r='256' fill='#008080' data-original='#2196f3'></circle><path fill='#FFFFFF' fill-rule='evenodd' d='m412.424 349.946-.273.688c-2.577 6.578-5.166 13.149-7.88 19.677-2.331 5.61-4.743 11.241-7.408 16.7-1.593 3.26-4.116 8.409-6.676 10.969a51.473 51.473 0 0 1-8.588 6.928c-17.86 11.431-40.186 9.82-59.813 4.557-84.306-22.585-196.673-134.952-219.26-219.257-5.26-19.633-6.868-41.965 4.574-59.825a50.861 50.861 0 0 1 6.914-8.577c2.557-2.56 7.712-5.082 10.969-6.675 5.465-2.665 11.1-5.077 16.71-7.408 6.525-2.7 13.1-5.3 19.673-7.88l.685-.264a15.416 15.416 0 0 1 19.044 6.655l32.593 56.466a15.517 15.517 0 0 1-5.66 21.128c-11.529 6.661-20.727 17.023-23.444 30.311a44.606 44.606 0 0 0 8.22 36.581 347.09 347.09 0 0 0 32.12 36.355 347.2 347.2 0 0 0 36.363 32.125 44.586 44.586 0 0 0 36.584 8.221c13.276-2.714 23.65-11.918 30.306-23.447a15.508 15.508 0 0 1 21.122-5.66l56.46 32.6a15.413 15.413 0 0 1 6.665 19.032z' data-original='#ffffff'></path></g></svg ><span> " + value.Phone1 + "</span></a>"
                            }
                        }

                        if (value.Address != null && value.Address != undefined && value.Address != "") {

                            htmlDrp += "<a  href='https://goo.gl/maps/t6UpALWeNm1riyRc6'> <div class='card-address' ><svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:svgjs='http://svgjs.com/svgjs' x='0' y='0' viewBox='0 0 512 512' style='enable-background:new 0 0 512 512' xml:space='preserve' class=''><g><path d='M256 112c-56.248 0-89.832 35.16-89.832 94.048 0 33.512 44.528 110.936 89.816 172.752 45.016-62.024 89.848-138.488 89.848-172.752C345.832 147.16 312.248 112 256 112zm-.096 134.344c-21.792 0-39.456-17.664-39.456-39.456s17.664-39.456 39.456-39.456 39.456 17.664 39.456 39.456-17.664 39.456-39.456 39.456z' fill='#008080' data-original='#000000' class=''></path><path d='M256 0C114.616 0 0 114.616 0 256s114.616 256 256 256 256-114.616 256-256S397.384 0 256 0zm14.992 412.32L256 432l-14.904-19.68c-10.968-14.336-106.928-142.448-106.928-206.272C134.168 129.48 181.96 80 256 80s121.832 49.48 121.832 126.048c0 63.728-95.968 191.84-106.84 206.272z' fill='#008080' data-original='#000000' class=''></path></g></svg> <span> " + value.GovermentAr + "-" + value.RegionAr + "-" + value.Address + "</span> </div></a>";
                        }
                        if (value.Discounts != null && value.Discounts != undefined && value.Discounts != "") {

                            htmlDrp += "<div class='card-discount'>" + value.Discounts + "</div >";
                        }
                        if (value.RegistraionCode != null && value.RegistraionCode != undefined && value.RegistraionCode != "") {

                            htmlDrp += "<h6 class='serial-num'> الرقم التسلسلي :" + value.RegistraionCode + "</h6>";
                        }
                        htmlDrp += "</div></div>"
                    }
                    else {

                        htmlDrp += "<div class='col-md-4 '><div class='afya-card' >"
                        if (value.Provider != null && value.Provider != undefined && value.Provider != "") {


                            htmlDrp += "<h5>" + value.Provider + "</h5>";
                        }
                        htmlDrp += " <div class='d-flex gap-2' >"
                        if (value.MasterNameEn != null && value.MasterNameEn != undefined && value.MasterNameEn != "") {

                            htmlDrp += "<h6 class='afya-type'>" + value.MasterNameEn + "</h6>"
                        }
                        if (value.SpecializationEn != null && value.SpecializationEn != undefined && value.SpecializationEn != "") {

                            htmlDrp += "<h6 class='card-specialization'> " + value.SpecializationEn + "</h6>"
                        }
                        htmlDrp += " </div ><hr />"
                        if (value.Phone1 != null && value.Phone1 != undefined && value.Phone1 != "") {
                            if (value.Phone2 != null && value.Phone2 != undefined && value.Phone2 != "") {

                                htmlDrp += "<div class='card-phone'><svg xmlns = 'http://www.w3.org/2000/svg' version = '1.1' xmlns: xlink = 'http://www.w3.org/1999/xlink' xmlns: svgjs = 'http://svgjs.com/svgjs' x = '0' y = '0' viewBox = '0 0 512 512' style = 'enable-background:new 0 0 512 512' xml: space = 'preserve' class='' > <g> <circle cx='256' cy='256' r='256' fill='#008080' data-original='#2196f3'></circle><path fill='#FFFFFF' fill-rule='evenodd' d='m412.424 349.946-.273.688c-2.577 6.578-5.166 13.149-7.88 19.677-2.331 5.61-4.743 11.241-7.408 16.7-1.593 3.26-4.116 8.409-6.676 10.969a51.473 51.473 0 0 1-8.588 6.928c-17.86 11.431-40.186 9.82-59.813 4.557-84.306-22.585-196.673-134.952-219.26-219.257-5.26-19.633-6.868-41.965 4.574-59.825a50.861 50.861 0 0 1 6.914-8.577c2.557-2.56 7.712-5.082 10.969-6.675 5.465-2.665 11.1-5.077 16.71-7.408 6.525-2.7 13.1-5.3 19.673-7.88l.685-.264a15.416 15.416 0 0 1 19.044 6.655l32.593 56.466a15.517 15.517 0 0 1-5.66 21.128c-11.529 6.661-20.727 17.023-23.444 30.311a44.606 44.606 0 0 0 8.22 36.581 347.09 347.09 0 0 0 32.12 36.355 347.2 347.2 0 0 0 36.363 32.125 44.586 44.586 0 0 0 36.584 8.221c13.276-2.714 23.65-11.918 30.306-23.447a15.508 15.508 0 0 1 21.122-5.66l56.46 32.6a15.413 15.413 0 0 1 6.665 19.032z' data-original='#ffffff'></path></g></svg ><span class='card-phone'> <a style='color:#000' href='tel:" + value.Phone1 + "'>" + value.Phone1 + "</a> --<a style='color:#000' href='tel:" + value.Phone2 + "'>" + value.Phone2 + "</a></span></div>"
                            } else {

                                htmlDrp += "<a class='card-phone' href='tel:" + value.Phone1 + "'><svg xmlns = 'http://www.w3.org/2000/svg' version = '1.1' xmlns: xlink = 'http://www.w3.org/1999/xlink' xmlns: svgjs = 'http://svgjs.com/svgjs' x = '0' y = '0' viewBox = '0 0 512 512' style = 'enable-background:new 0 0 512 512' xml: space = 'preserve' class='' > <g> <circle cx='256' cy='256' r='256' fill='#008080' data-original='#2196f3'></circle><path fill='#FFFFFF' fill-rule='evenodd' d='m412.424 349.946-.273.688c-2.577 6.578-5.166 13.149-7.88 19.677-2.331 5.61-4.743 11.241-7.408 16.7-1.593 3.26-4.116 8.409-6.676 10.969a51.473 51.473 0 0 1-8.588 6.928c-17.86 11.431-40.186 9.82-59.813 4.557-84.306-22.585-196.673-134.952-219.26-219.257-5.26-19.633-6.868-41.965 4.574-59.825a50.861 50.861 0 0 1 6.914-8.577c2.557-2.56 7.712-5.082 10.969-6.675 5.465-2.665 11.1-5.077 16.71-7.408 6.525-2.7 13.1-5.3 19.673-7.88l.685-.264a15.416 15.416 0 0 1 19.044 6.655l32.593 56.466a15.517 15.517 0 0 1-5.66 21.128c-11.529 6.661-20.727 17.023-23.444 30.311a44.606 44.606 0 0 0 8.22 36.581 347.09 347.09 0 0 0 32.12 36.355 347.2 347.2 0 0 0 36.363 32.125 44.586 44.586 0 0 0 36.584 8.221c13.276-2.714 23.65-11.918 30.306-23.447a15.508 15.508 0 0 1 21.122-5.66l56.46 32.6a15.413 15.413 0 0 1 6.665 19.032z' data-original='#ffffff'></path></g></svg ><span> " + value.Phone1 + "</span></a>"
                            }
                        }

                        if (value.Address != null && value.Address != undefined && value.Address != "") {

                            htmlDrp += "<a  href='https://goo.gl/maps/t6UpALWeNm1riyRc6' target='_blank'> <div class='card-address' ><svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:svgjs='http://svgjs.com/svgjs' x='0' y='0' viewBox='0 0 512 512' style='enable-background:new 0 0 512 512' xml:space='preserve' class=''><g><path d='M256 112c-56.248 0-89.832 35.16-89.832 94.048 0 33.512 44.528 110.936 89.816 172.752 45.016-62.024 89.848-138.488 89.848-172.752C345.832 147.16 312.248 112 256 112zm-.096 134.344c-21.792 0-39.456-17.664-39.456-39.456s17.664-39.456 39.456-39.456 39.456 17.664 39.456 39.456-17.664 39.456-39.456 39.456z' fill='#008080' data-original='#000000' class=''></path><path d='M256 0C114.616 0 0 114.616 0 256s114.616 256 256 256 256-114.616 256-256S397.384 0 256 0zm14.992 412.32L256 432l-14.904-19.68c-10.968-14.336-106.928-142.448-106.928-206.272C134.168 129.48 181.96 80 256 80s121.832 49.48 121.832 126.048c0 63.728-95.968 191.84-106.84 206.272z' fill='#008080' data-original='#000000' class=''></path></g></svg> <span> " + value.GovermentEn + "-" + value.RegionEn + "-" + value.Address + "</span> </div></a>";
                        }
                        if (value.Discounts != null && value.Discounts != undefined && value.Discounts != "") {

                            htmlDrp += "<div class='card-discount'>" + value.Discounts + "</div >";
                        }
                        if (value.RegistraionCode != null && value.RegistraionCode != undefined && value.RegistraionCode != "") {

                            htmlDrp += "<h6 class='serial-num'> Serial Number: " + value.RegistraionCode + "</h6>";
                        }
                        htmlDrp += "</div></div>"
                    }
                });
                $(".SearchAfiaCards").append(htmlDrp);
                $("#imgAjaxLoader").hide();
            },
            error: function (xhr) {
                toastr.error(xhr.error);
                $("#imgAjaxLoader").hide();
            }
        });
}


function getMasterCodeAddCase() {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: MersalWebAPIBaseUrl + "api/MasterAfia/getlookup",
        async: true,
        success: function (data) {
            var htmlDrp = "<option value='null'></option>";
            $.each(data, function (key, value) {
                var selec = "";
                if (_cultureIsArabic) {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                }
                else {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                }
            });
            $(".LargeUnit").append(htmlDrp);

            $('.LargeUnit').val(MasterId);

        },
        error: function (xhr) {
            toastr.error(xhr.error);
        }
    });
}

function getgoverments() {
  
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetByMasterCodeIdForAfiaGov?masterCodeId=1024",
        async: true,
        success: function (data) {
            var htmlDrp = "";
            if (_cultureIsArabic) {
                htmlDrp += "<option  selected value='null'>المحافظة</option>";
            }
            else {
                htmlDrp += "<option  selected value='null'>Goverment</option>";
            }
            $.each(data, function (key, value) {
                var selec = "";
                if (_cultureIsArabic) {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                }
                else {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                }
            });
            $(".goverments").append(htmlDrp);

            $('.goverments').change(e => {
                getRegions($('.goverments').val())

            })
            var htmlDrp2 = "";
            if (_cultureIsArabic) {
                htmlDrp2 += "<option  selected value='null'>المدينة</option>";
            }
            else {
                htmlDrp2 += "<option  selected value='null'>City</option>";
            }
            $(".Region").append(htmlDrp2);

        },
        error: function (xhr) {
            toastr.error(xhr.error);
        }
    });
}

function getRegions(parentId) {
    $('.Region option:selected').removeAttr('selected');
    $(".Region").empty()
    masterafia = $('.MasterAfia option:selected').val() ? $('.MasterAfia option:selected').val() : urlParams.get('masterId');

    if (parentId != 'null') {
        $.ajax({
            type: "GET",
            contentType: "application/json",
            url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetByParentIdForAfiaReg?parentId=" + parentId + "&masterafia=" + masterafia,
            async: true,
            success: function (data) {
                var htmlDrp = "";
                if (_cultureIsArabic) {
                    htmlDrp += "<option  selected value='null'>المدينة</option>";
                }
                else {
                    htmlDrp += "<option  selected value='null'>City</option>";
                }
                $.each(data, function (key, value) {
                    var selec = "";
                    if (_cultureIsArabic) {
                        htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                    }
                    else {
                        htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                    }
                });
                $(".Region").append(htmlDrp);


            },
            error: function (xhr) {
                toastr.error(xhr.error);
            }
        });
    } else {
        var htmlDrp = "";
        if (_cultureIsArabic) {
            htmlDrp += "<option  selected value='null'>المدينة</option>";
        }
        else {
            htmlDrp += "<option  selected value='null'>City</option>";
        }
        $(".Region").append(htmlDrp);

    }
   
}
function getsubspecialty() {
    const urlParams = new URLSearchParams(window.location.search);

    masterafia = $('.MasterAfia option:selected').val() ? $('.MasterAfia option:selected').val() : urlParams.get('masterId');
    console.log(masterafia)
    $('.subspecialty option:selected').removeAttr('selected');
    $(".subspecialty").empty()
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetByMasterCodeIdForAfiaSubSep?masterCodeId=5079" + "&masterafia=" + masterafia,
        async: true,
        success: function (data) {
            var htmlDrp = "";

            if (_cultureIsArabic) {
                htmlDrp += "<option  selected value='null'>التخصص</option>";
            }
            else {
                htmlDrp += "<option  selected value='null'>Specialty</option>";
            }
            $.each(data, function (key, value) {
                var selec = "";
                if (_cultureIsArabic) {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                }
                else {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                }
            });
            $(".subspecialty").append(htmlDrp);


        },
        error: function (xhr) {
            toastr.error(xhr.error);
        }
    });
}