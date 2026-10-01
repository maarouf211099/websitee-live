var searchObjectBuilder = function () {
    var getJsonSearchObj = function (selectorId) {
        var jsonObj = {};
     
        $("#" + selectorId).each(function (index) {
            if ($(this).attr('type') == 'text') {
                var str = $.trim($(this).val());
                $(this).val(str);
                jsonObj[$(this).attr("id")] = str;
            }
            else if ($(this).attr('type') == 'checkbox') {
                jsonObj[$(this).attr("id")] = $(this).is(":checked");
            }
             
        });

        return jsonObj;
    };

    return {
        getJsonSearchObj: getJsonSearchObj
    }
}();