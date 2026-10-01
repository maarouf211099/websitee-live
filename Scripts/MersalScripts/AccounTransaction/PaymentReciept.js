function SetAccount() {
  
    var apiurl = MersalWebAPIBaseUrl + "api/CashCustodyConfirmation/GetAccountIDbyTransactionId?Id=" + $("#RecieptCodeDRP").val();
    $.ajax({
        type: "get",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),

        async: false,
        success: function (data) {
            var drp = $('#AccountDRP').data('kendoComboBox');
            drp.value(data);
           
            drp.enable(false);

        },
        error: function (xhr) {

        }
    });
}
$(function () {
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
    $("#RecieptCodeDRP").kendoComboBox({
        placeholder: AccountDRPPlacholder,
        dataTextField: "Code",
        dataValueField: "Id",
        filter: "contains",
        change: SetAccount,
        dataSource: {
            transport: {
                read: {
                    url: MersalWebAPIBaseUrl + "api/CashCustodyConfirmation/GetAllRecieptCodes",
                    headers: getHeaders()
                }
            }
        }
        ,
        filter: "contains",
        suggest: true,
    });
});
