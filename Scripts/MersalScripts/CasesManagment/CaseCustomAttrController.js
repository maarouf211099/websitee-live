


function RefreshGird() {
    $('#panelGrid').hide('slow')
    BindGrid(); 
    $('#panelGrid').show('slow')

}
function GetType() {

    var val = $('#TypeId').val();
    if ($('#TypeId').val() == "") {
        return { TypeID: -1 }
    }
    return { TypeID: $('#TypeId').val() }
}
function hideConfirm() {
    $('#ConfirmSave').modal('hide');
}
hideErrorMSG();
function hideErrorMSG() {
    $('#TypeIderror').hide()
    $('#Propertyerror').hide();
    $('#CategoryIderror').hide();
    $('#AttributeDescriptionerror').hide();
    $('#DataTypeIderror').hide();
    $('#MasterCodeIDerror').hide();
    $('#CaseCategoryIDerror').hide();

}

function showConfirm() {
    var validastate = true; 
    if ($('#DataTypeId').val() == lookupID && $('#MasterCodeID').val() == "") {
        $('#MasterCodeIDerror').show().addClass(" field-validation-error");
        validastate = false;
    }
    else if ($("#DataTypeId").val() == "") {
        $('#DataTypeIderror').show().addClass(" field-validation-error");
        validastate = false;
    }
    else  if ($('#Property').val() == "") {
        $('#Propertyerror').show().addClass(" field-validation-error");
        validastate = false;
    } 
    else if ($('#CaseCategory').val() == "") {
        $('#CaseCategoryIDerror').show().addClass(" field-validation-error");
        validastate = false;
    }

    if (validastate == true) {
        hideErrorMSG();
        $('#btnDelete').hide();
        $('#btnCreate').show();
        $('#ConfirmSave').modal('show');
    }
}
function Design() {
    $('.k-animation-container').css('margin-left', '0px');
    $('.k-animation-container').css('padding-left', '0px');
    $('.k-invalid-msg').hide();
}

function masterCodeID() {
    return { masterCodeID: CategoryMasterCodeID }
}



function CategoryId() {

    id = parseInt($("#CategoryId").val())

    if (id != "") {
        return { ParentID: id }
    }
    else {
        return { ParentID: -1 }
    }
}
function GetTypes() {
    $('#TypeId').data('kendoComboBox').dataSource.read(CategoryId());
    $('#TypeId').data("kendoComboBox").value("")
}
function addRow(url) {
    var IsRequired = false;
    var Count = $('#Count').val();

    if ($("#IsRequired:checked").length > 0) {
        IsRequired = true;
    }
    maxdate = "";
    mindate = "";

    if ($('#MinDateNow:checked').length > 0) {
        mindate = "now";
    }
    else {
        mindate = $('#MinDate').val()
    }
    if ($('#MAxDateNow:checked').length > 0) {
        maxdate = "now";
    }
    else {
        maxdate = $('#MaxDate').val()
    }

    jsonDTo = {
        TypeID: $('#TypeId').val()
        , AttributeName: $('#Property').val()
        , AttributeDescription: $('#AttributeDescription').val()
       , MinDate: mindate
        , MaxDate: maxdate
       , MinLength: $("#MinLength").val()
       , MaxLength: $("#MaxLength").val()
       , MaxValue: $("#MaxValue").val()
       , MinValue: $("#MinValue").val()
       , DataTypeId: $("#DataTypeId").val()
        , MasterCodeID: $("#MasterCodeID").val()
        , IsRequired: IsRequired
        , CaseCategory :$('#CaseCategory').val() 
    }

    $.ajax({
        url: url,
        type: 'Post',
        data: jsonDTo,
        success: function (res) {

            if (res == "1") {
                RefreshGird();
                toastr.success(successMsg)

            }
            else {
                toastr.error(ErrorMsg)
            }
            $('.modal').modal('hide');
        }
    });
}

function getDelete(Id, IsDeleted) {
    IdDelete = Id;
    $('#btnDelete').show();
    $('#btnCreate').hide();
    $('#ConfirmSave').modal('show');

}
function SoftDelete(url, IsDeleted) {
    url = url + '?id=' + IdDelete;
    $.ajax({
        url: url,
        type: 'get',
        //data: { entity: jsonDTo },
        success: function (res) {

            if (res == "1") {
                RefreshGird();
                toastr.success(successMsg)

            }
            else {
                toastr.error(ErrorMsg)
            }
            $('#ConfirmSave').modal('hide');
        }
    });
}

function cancelUpdate() {
    $("#DataTypeId").data("kendoComboBox").value(null);
    $('#Property').val('')
    $('#AttributeDescription').val('')
    $("#btnAdd").show()
    $("#btnUpdate").hide()
    //RefreshGird();
    GetValidateInput()

}

function Update(url) {
    var IsRequired = false;
    var Count = $('#Count').val();


    if ($("#IsRequired:checked").length > 0) {
        IsRequired = true;
    }
    maxdate = "";
    MinDate = "";

    if ($('#MinDateNow:checked').length > 0) {
        updatedobject.MinDate = "now";
    }
    else {
        updatedobject.MinDate = $('#MinDate').val()
    }
    if ($('#MAxDateNow:checked').length > 0) {
        updatedobject.MaxDate = "now";
    }
    else {
        updatedobject.MaxDate = $('#MaxDate').val()
    }


    updatedobject.TypeID = $('#TypeId').val()
    updatedobject.AttributeName = $('#Property').val()
    updatedobject.AttributeDescription = $('#AttributeDescription').val()

    updatedobject.MinLength = $("#MinLength").val()
    updatedobject.MaxLength = $("#MaxLength").val()
    updatedobject.MaxValue = $("#MaxValue").val()
    updatedobject.MinValue = $("#MinValue").val()
    updatedobject.DataTypeId = $("#DataTypeId").val()
    updatedobject.MasterCodeID = $("#MasterCodeID").val()
    updatedobject.IsRequired = IsRequired



    $.ajax({
        url: url,
        type: 'Post',
        data: updatedobject,
        success: function (res) {

            $("#btnAdd").show()
            $("#btnUpdate").hide()
            if (res == "1") {
                RefreshGird();

                cancelUpdate()
                toastr.success(successMsg)

            }
            else {
                toastr.error(ErrorMsg)
            }
            $('.modal').modal('hide');
        }
    });
}
