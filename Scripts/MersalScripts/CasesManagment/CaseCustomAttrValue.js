
function GetAllFunctionCaseCustomAttr() {

    function Search() {
        $('#gridPanel').hide('slow')
        var grid = $('#Grid').data("kendoGrid");
        grid.dataSource.read();
        $('#gridPanel').show('slow');

    }
    function filters() {
        var location;
        if ($('#dlocation').val() != "") {
            location = $('#dlocation').val();
        }
        else if ($('#flocation').val() != "") {
            location = $('#flocation').val();
        }
        else {
            location = $('#location').val();
        }

        return {
            number: $('#number').val(), TypeID: $("#TypeId").val(), categorId: $('#CategoryId').val(), locationId: location, IsSold: null
        }
    }
    function Design() {
        $('.k-animation-container').css('margin-left', '0px');
        $('.k-animation-container').css('padding-left', '0px');
        $('.k-invalid-msg').hide();
    }
    function masterCodeID() {
        return { masterCodeID: 5 }
    }
    function CategoryId() {

        if ($("#CategoryId").val() != "") {
            return { ParentID: $("#CategoryId").val() }
        }
        else {
            return { ParentID: -1 }
        }
    }

    function getlocation() {

        if ($("#location").val() != "") {
            return { id: $("#location").val() }
        }
        else {
            return { id: -1 }
        }
    }

    function getflocation() {

        if ($("#flocation").val() != "") {
            return { id: $("#flocation").val() }
        }
        else {
            return { id: -1 }
        }
    }


    function GetTypes() {
        $('#AssetType').data('kendoComboBox').dataSource.read(CategoryId());
        $('#AssetType').data("kendoComboBox").value("")
    }


    function GetChidLocations() {
        $('#flocation').data('kendoComboBox').dataSource.read(getlocation());
        $('#flocation').data("kendoComboBox").value("");
        $('#dlocation').data('kendoComboBox').dataSource.read(getflocation());
        $('#dlocation').data("kendoComboBox").value("");
    }

    function GetDeskLocations() {
        $('#dlocation').data('kendoComboBox').dataSource.read(getflocation());
        $('#dlocation').data("kendoComboBox").value("");
    }


    function GetAndSetCustomeAtrrValues() {
        var url = MersalWebAPIBaseUrl + 'CaseCustomAttribute/GetCustomeAttrValuesByCaseId?CaseId=' + caseId;
        $.ajax({
            url: url,
            type: 'get',
            success: function (listAttrValues) {
                var attrVal = [];
                if (listAttrValues) {
                    for (var i = 0; i < listAttrValues.length; i++) {

                        var htmlElement = '#' + listAttrValues[i].AttributeID;
                        var ElementValue = listAttrValues[i].AttributeValue;
                        $(htmlElement).val(ElementValue);

                        var elementType = $(htmlElement).prop('type');
                        if (elementType == 'select-one') {
                            attrVal.push({ htmlElement: htmlElement, ElementValue: ElementValue })

                        }
                    }
                    setTimeout(function () {
                        for (var i = 0; i < attrVal.length; i++) {
                            $(attrVal[i].htmlElement + " option[value='" + attrVal[i].ElementValue + "']").attr('selected', true);
                        }
                    }, 2000);
                }
            }
        });
    }

    // Scrit Custome Attribute 
    function ValidateCustomeAttr() {
        var isValid = true;
        $("#CustomAttr .Errore").hide();
        var inputs = $("#CustomAttr :input");
        for (var i = 0; i < inputs.length; i++) {

            var element = $(inputs[i]);
            var minlenght = element.attr("minlenght");
            var maxlenght = element.attr("maxlenght");
            var mindate = element.attr("mindate");
            var maxdate = element.attr("maxdate");
            var minvalue = element.attr("minvalue");
            var maxvalue = element.attr("maxvalue");

            if (element.attr("required") != undefined && element.val() == "") {
                element.closest("div").append('<label class="Errore field-validation-error" for=""  style="display: inline-block;">' + RequiredRES + '</label>')
                isValid = false;
            } else if (minlenght != "" && minlenght != undefined && element.val().length <= minlenght) {
                element.closest("div").append('<label class="Errore field-validation-error" for=""  style="display: inline-block;">' + MinLenghtError + minlenght + '</label>')
                isValid = false;

            }


            else if (maxlenght != "" && maxlenght != undefined && element.val.length >= maxlenght) {
                element.closest("div").append('<label class="Errore field-validation-error" for=""  style="display: inline-block;">' + MaxLenghtError + maxlenght + '</label>')
                isValid = false;

            }

            else if (mindate != "" && mindate != undefined && element.val() != "") {
                var dateMin = null;
                var dateMax = null;
                if (mindate == "now") {
                    var dateMin = ReturnDate("");
                    mindate = DateNow;
                }
                else {
                    var dateMin = ReturnDate(mindate);

                }
                if (maxdate == "now") {
                    var dateMax = ReturnDate("")
                    maxdate = DateNow;

                }
                else {
                    var dateMax = ReturnDate(maxdate);
                }
                var Date = element.data("kendoDatePicker").value();

                if (Date < dateMin) {
                    element.closest("div").append('<label class="Errore field-validation-error" for=""  style="display: inline-block;">' + MinDateError + " " + mindate + '</label>')
                    isValid = false;

                }
                else if (Date > dateMax) {
                    element.closest("div").append('<label class="Errore field-validation-error" for=""  style="display: inline-block;">' + MaxDateError + " " + maxdate + '</label>')
                    isValid = false;

                }
            }



            else if (maxvalue != "" && maxvalue != undefined && parseFloat(element.val()) > parseFloat(maxvalue)) {
                element.closest("div").append('<label class="Errore field-validation-error" for=""  style="display: inline-block;">' + MaxValueError + maxvalue + '</label>')
                isValid = false;

            }
            else if (minvalue != "" && minvalue != undefined && parseFloat(element.val()) < parseFloat(minvalue)) {
                element.closest("div").append('<label class="Errore field-validation-error" for=""  style="display: inline-block;">' + MinValueError + minvalue + '</label>')
                isValid = false;

            }


        }
        return isValid;
    }


    function ReturnDate(str) {
        if (str != "") {
            return new Date(str)
        }
        else {
            return new Date()
        }
    }

    function AppendCustomeAttr() {

        try {
            $('#CustomAttr').hide(100);
            $('#CustomAttr').html('');
            GetCustomeAttr('#CustomAttr', $("#caseCategoryHID").val()) //$("#Category").val());// 
            //GetCustomeAttr('#CustomAttr', $('#AssetType').val())
            $("#CustomAttr").first().show(1000, function showNext() {
                $(this).next("div").show(1000, showNext);
            });
        } catch (e) {

        }

    }
    function GetCustomeAttr(divId, CategoryId) {
        if (CategoryId == "") {
            return;
        }
        var url = MersalWebAPIBaseUrl + 'CaseCustomAttribute/GetCustomAttrByCaseCategroy?CaseCategory=' + CategoryId
        $.ajax({

            url: url,
            type: 'get',
            // data: { typeId: TypeId },
            success: function (jsonData) { 
                $(divId).html("");
                if (jsonData == null ) {
                    return;
                }
                $.each(jsonData, function (index) {
                    var Required = "";

                    if (index % 4 == 0) {
                        $(divId).append('<div class=\"row\"></div>');

                    }

                    if (jsonData[index].IsRequired == true) {

                        Required = "Required=true";
                    }
                    if (jsonData[index].DataTypeId == DataTypeINT || jsonData[index].DataTypeId == DataTypeFloat) {
                        $(divId + " .row").last().append('<div class=\"col-md-3\">   <div class=\"form-group\"> <label class=\"control-label\">' + jsonData[index].AttributeName + '</label><input onchange="ValidateCustomeAttr()" ' + RequiredRES + '  minvalue=\"' + jsonData[index].MinValue + '\"  maxvalue=\"' + jsonData[index].MaxValue + '\"  class=\"form-control CustomeAttr\"  id=\"' + jsonData[index].ID + '\" type=\"text\" /></div></div>')

                    }
                    else if (jsonData[index].DataTypeId == DataTypeString) {
                        $(divId + " .row").last().append('<div class=\"col-md-3\">   <div class=\"form-group\"> <label class=\"control-label\">' + jsonData[index].AttributeName + '</label><input onchange="ValidateCustomeAttr()" maxlenght=\"' + jsonData[index].MaxLength + '\"  ' + RequiredRES + ' minlenght=\"' + jsonData[index].MinLength + '\"  class=\"form-control CustomeAttr\"  id=\"' + jsonData[index].ID + '\" type=\"text\" /></div></div>')

                    }
                    else if (jsonData[index].DataTypeId == DataTypeDate) {
                        $(divId + " .row").last().append('<div class=\"col-md-3\">    <div class=\"form-group\"> <label class=\"control-label\">' + jsonData[index].AttributeName + '</label><br /><input onchange="ValidateCustomeAttr()" ' + RequiredRES + ' data-datepicker=true maxdate=\"' + jsonData[index].MaxDate + '\"mindate=\"' + jsonData[index].MinDate + '\" style="width: 100%;"  class=\"form-control CustomeAttr\"  id=\"' + jsonData[index].ID + '\" type=\"text\" /></div></div>')
                        $('[data-datepicker]').kendoDatePicker({
                            culture: "ar-EG",

                            format: "{0:MM/dd/yyyy}"
                        });
                    }
                    else if (jsonData[index].DataTypeId == LOKUP) {
                        $(divId + " .row").last().append('<div class=\"col-md-3\">   <div class=\"form-group\"> <label class=\"control-label\">' + jsonData[index].AttributeName + '</label><br /><select onchange="ValidateCustomeAttr()" ' + RequiredRES + '  class=\"form-control CustomeAttr\"  id=\"' + jsonData[index].ID + '\" " ><option/></select></div></div>')
                        url = '/SystemCodeAPI/GetAllDetails' + '?masterCodeId=' + jsonData[index].MasterCodeID;


                        FillDDL($('#' + jsonData[index].ID), url)

                    } else {
                        $(divId + " .row").last().append('<div class=\"col-md-3\">   <div class=\"form-group\"> <label class=\"control-label\">' + jsonData[index].AttributeName + '</label><input onchange="ValidateCustomeAttr()" maxlenght=\"' + jsonData[index].MaxLenght + '\"  ' + RequiredRES + ' minlenght=\"' + jsonData[index].MinLength + '\"  class=\"form-control CustomeAttr\"  id=\"' + jsonData[index].ID + '\" type=\"text\" /></div></div>')

                    }


                })
                GetAndSetCustomeAtrrValues();
            }
        })
    }


    function FillDDL(ddl, url) {
        $.ajax({
            url: url,
            type: 'get',

            success: function (data) {
                ddl.empty();
                ddl.append(
                   $('<option/>', {
                       value: '',
                       text: SelectRES,

                   }));

                $.each(data, function (index, item) {
                    ddl.append(
                        $('<option/>', {
                            value: item.Value,
                            text: item.Text,

                        })
                    );


                });


            },

        });

    }

    $("#Category").change(function () {
        $("#caseCategoryHID").val($("#Category").val());
       // $("#serviceIDs").val("");
        getCasesServices();
        AppendCustomeAttr();
    });
    getCasesServices();
    AppendCustomeAttr();

}