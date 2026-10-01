
function onUploadBankTransferImageCreate(e) {
    var myForm = $("#DonationbyBankTransferForm");
    if (!myForm.valid()) {
        $("#Image").data("kendoUpload").trigger("cancel");
        e.preventDefault();
        return;
    };
    var data = {};
    $("#DonationbyBankTransferForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    e.data = data;
}
function onSuccessUploadDataCreate(e) {

    toastr.success(SuccessfulProcess);
     
    document.getElementById("DonationbyBankTransferForm").reset();
    var hh = $('#BankId').val(null);
    $('#BankId').val(null);
    var sss = $('#BankId').val('');

    $('#DonationCurrencyId').val(null);
    $('#DonationAccountId').val(null);
}


function onSelectDonationImage() {

    setTimeout(function () { $(".k-upload-selected").hide(); }, 1);
    $(".field-validation-error").html("");
}


var DonationbyBankTransferForm = $("#DonationbyBankTransferForm");
DonationbyBankTransferForm.submit(function (e) {
     

    var upload = $("#Image").data("kendoUpload");

    var len = upload.wrapper.find(".k-file").length;
    $.validator.unobtrusive.parse(DonationbyBankTransferForm);
    e.preventDefault();

    if (!DonationbyBankTransferForm.valid()) {
        return
    }
    ;
    $(".k-upload-selected").click();

    if (len > 0) {

        //var hasFile = true;
        //if (len === 0) {
        //    hasFile = false;
        //}

        //if (!hasFile) {
        //    var validator = $("#DonationbyBankTransferForm").validate();
        //    var errors = { Image: PleaseUploadTransferImage };
        //    validator.showErrors(errors);;
        //}
        //else { 
        //    $(".field-validation-error").html("");
        //}

       
    }
    else {

        $.validator.unobtrusive.parse(DonationbyBankTransferForm);
        e.preventDefault();

        if (!DonationbyBankTransferForm.valid()) {
            return
        }
        ;
        $(".k-upload-selected").click();

    
    var data = {};
    $("#DonationbyBankTransferForm").serializeArray().map(function (x) { data[x.name] = x.value; });

    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: 'Donation/DonationBankByTransfer',
        crossDomain: true,
        headers: getHeaders(),
        data: JSON.stringify(data),
        async: true,
        beforeSend: function () {

            $("#imgAjaxLoader").show();
        },
        success: function (data) {
             
            $("#imgAjaxLoader").hide();
            toastr.success(SuccessfullyAdd);
            document.getElementById("DonationbyBankTransferForm").reset();
            $('#DonationDestinationIdd').change();
            var hh = $('#BankId').val(null);
        $('#BankId').val(null);
            var sss = $('#BankId').val('');

            $('#DonationCurrencyId').val(null);
            $('#DonationAccountId').val(null);

        },
        error: function (xhr) {
            //$("#imgAjaxLoader").hide();
            //toastr.error(xhr.error);

            //new code for test

            $("#imgAjaxLoader").hide();
            toastr.success(SuccessfullyAdd);
            document.getElementById("DonationbyBankTransferForm").reset();
            var hh = $('#BankId').val(null);
            $('#BankId').val(null);
            var sss = $('#BankId').val('');

            $('#DonationCurrencyId').val(null);
            $('#DonationAccountId').val(null);
            $('#TransferDate').val(null);

        }
    });
    }


});
