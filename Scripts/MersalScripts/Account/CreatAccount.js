GetAnyMasterDetalisCode("PROJ", "ProjectId")
GetAnyMasterDetalisCode("ACCTYP", "TypeId")
var isBank = false;
function CheckBankAccount(obj) {

    if ($('#TypeId').find(":selected").attr("code") == "BANK") {
        $("#bankDetails").show("slide")
        isBank = true;
    }
    else {
        $("#bankDetails").hide("slide")
        isBank = false;
    }
}
function CreateAccount() {

    var myForm = $("#CreateAccountForm");

    //$.validator.unobtrusive.parse(myForm)

    if (!myForm.valid()) return;
    if (parentAccountID == 0) {
        parentAccountID = null;
    }
    var apiurl = MersalWebAPIBaseUrl + "api/Accounts/CreateAccount";
    var DTO = {
        Name: $("#Name").val(),
        Description: $("#Description").val(),
        OpeningBalance: $("#OpeningBalance").val(),
        ProjectId: $("#ProjectId").val(),
        IsActive: true,
        TypeId: $("#TypeId").val(),
        ParentId: parentAccountID,
        BankDetailsDTO: {
            Name: $("#BankDetailsDTO_Name").val(),
            AccountNumber: $("#BankDetailsDTO_AccountNumber").val(),
            Location: $("#BankDetailsDTO_Location").val(),
            Details: $("#BankDetailsDTO_Details").val(),
        }
    };
    if ($("#IsActive").prop("checked") == false) {
        DTO.IsActive = false;
    }
    if (isBank == false) {
        DTO.BankDetailsDTO = null;
    }

    //console.log(JSON.stringify(data));
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
                GetAndDrawAccountTree()

                toastr.success(SuccessfullyAdd + " - " + data);
                document.getElementById("CreateAccountForm").reset();
                parentAccountID = 0;
                HideAnyModal();
            }
            else {
                toastr.error(Error);
            } 
        },
        error: function (xhr) {
            $(".popup-form").removeClass("active").slideUp();
            $("body").find(".popup").fadeOut();
            toastr.error(xhr.error); 
        }
    });

}