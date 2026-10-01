

var bindingListWithJson = function () {
    var jsonObj,
    selectId,
    Id,
    Name

    //Constructors
    init = function (_jsonData, _selectId, _id, _name) {
        jsonObj = _jsonData;
        selectId = _selectId;
        Id = _id;
        Name = _name;
    },

    //Functions
    bind = function (index, val) {
        //$("#" + selectId).empty();

        $.each(jsonObj, function (index) {
            $("#" + selectId).append('<option value=' + jsonObj[index][Id] + '>' + jsonObj[index][Name] + '</option>');
        });
    },
    setSelected = function (_selectId, selectedVal) {
        $("#" + _selectId).val(selectedVal);
    },
    removeDuplication = function (notAssignedListId, assignedListId) {
        $('#' + assignedListId + ' option').each(function () {
            $('#' + notAssignedListId + ' option[value="' + $(this).val() + '"]').remove();
        });
    },
    addCustomOption = function (_selectId, _text, _value, _checked) {
        var checkedAttr = "";
        if (_checked == true) {
            checkedAttr = "Selected=\"true\"";
        }

        $("#" + _selectId).append('<option value=' + _value + ' ' + checkedAttr + '>' + _text + '</option>');
    },
    getJsonObj = function (_selectId, _id, _name) {
        var jsonArr = [];
        var id = _id;
        var name = _name;

        $.each($("#" + _selectId + ' option'), function (index) {
            jsonArr.push({
                id: "" + $(this).val() + "",
                name: "" + $(this).text() + ""
            });
        });

        return jsonArr;
    };

    return {
        //Functions
        init: init,
        bind: bind,
        setSelected: setSelected,
        addCustomOption: addCustomOption,
        removeDuplication: removeDuplication,
        getJsonObj: getJsonObj
    };
}();


