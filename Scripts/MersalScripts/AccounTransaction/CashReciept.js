$(function () {
    GetCode()
    $("#AccountDRP").kendoComboBox({
        placeholder: AccountDRPPlacholder,
        dataTextField: "Name",
        dataValueField: "Id",
        filter: "contains",
        dataSource: {
            transport: {
                read: {
                    url: MersalWebAPIBaseUrl + "api/Accounts/GetAllAccount",
                    headers: getHeaders()
                }
            }
        }
           ,
        filter: "contains",
        suggest: true,
    });
    $("#EmployeeDRP").kendoComboBox({
        placeholder: EmplyeeDRPPlacholder,
        dataTextField: "FirstName",
        dataValueField: "Id",
        filter: "contains",
        dataSource: {
            transport: {
                read: {
                    url: UserNamagementWebAPIBaseUrl + "api/User/GetAllUsers",
                    headers: getHeaders()
                }
            }
        }
       ,
        filter: "contains",
        suggest: true,
    });

    $("#value").blur(function () {
        var accountId = $("#AccountDRP").val()
        //if () {

        //}
        var apiurl = MersalWebAPIBaseUrl + "api/Accounts/GetAccountBalance?accountId=" + accountId;
        $.ajax({
            type: "get",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),

            async: false,
            success: function (data) {
                
                var balance = parseInt(data);
                var value = parseInt($("#value").val());
                if (value > balance) {
                    toastr.error(ValueVSBalanceMSG)
                    $("#value").val("")
                }

            },
            error: function (xhr) {

            }
        });
    });
});
var code = "";
function GetCode() {
    var apiurl = MersalWebAPIBaseUrl + "api/CashCustodyConfirmation/getCode";
    $.ajax({
        type: "get",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),

        async: false,
        success: function (data) {
            
            code = data;

        },
        error: function (xhr) {

        }
    });
}
function PrintElem(elem) {
    Popup($(elem).html());
}
function Popup(data) {
    var mywindow = window.open('', '', '');
    mywindow.document.write('<html><head><title></title>');
    mywindow.document.write('</head><body >');
    mywindow.document.write(data);
    mywindow.document.write('</body></html>');
    mywindow.document.close(); // necessary for IE >= 10
    mywindow.focus(); // necessary for IE >= 10
    mywindow.print();
    mywindow.close();
    return true;
}
function Print() {
    $("#AccountTXT").html(AccountRES + " / " + $("#AccountDRP").data("kendoComboBox").text())
    $("#ValueTXT").html(valueRES + " / " + $("#value").val() + "  " + poundsRES)
    $("#EmplyeeTXT").html(EmpployeRes + " / " + $("#EmployeeDRP").data("kendoComboBox").text())
    $("#codeTXT").html(codeRes + " / " + code)

    

    $("#DescibtionTXT").html($("#describtion").val())
    PrintElem("#PrintDIV")
}
function CreateCashReciept() {
    $("#AccountDRPMSG").hide();
    $("#EmployeeDRPMSG").hide();

    var myForm = $("#CreateCashReciept");
    var accountId = $("#AccountDRP").val()
    var EmployeeId = $("#EmployeeDRP").val()

    if (accountId == "") {
        $("#AccountDRPMSG").show();

    }
    if (EmployeeId == "") {
        $("#EmployeeDRPMSG").show();

    }
    if (!myForm.valid() || accountId == "" || EmployeeId == "") return;
    //Print()
    var DTO = {
        AccountId: accountId,
        EmployeeId: EmployeeId,
        Value: ($("#value").val()*-1),
        Details: $("#describtion").val(),
        ISCustody: false,
        IsConfirm: false,
        Code: code,
        IsPayment:false
    }
    var apiurl = MersalWebAPIBaseUrl + "api/CashCustodyConfirmation/Create";
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),
        data: JSON.stringify(DTO),
        async: false,
        success: function (data) {
            if (data > 0) {

                toastr.success(SuccessfullyAdd + " - " + data);
                document.getElementById("CreateCashReciept").reset();
            }
            else {
                toastr.error(Error);
            } 
        },
        error: function (xhr) {
            // HideAnyModal();
            toastr.error(xhr.error); 
        }
    });
}