
$(document).ready(function () {

    const urlParams = new URLSearchParams(window.location.search);
    const donate = urlParams.get('donate');
    if (donate == 0) {
        callDonationpopup(2);
    }
    $('#Donate10').click(function () {
        $("#mesageAmount").addClass("hidden");

        $("#AmountTextArea").attr("readonly", true).val(10);
    });

    $('#Donate50').click(function () {
        $('#mesageAmount').addClass('hidden');

        $("#AmountTextArea").attr("readonly", true).val(50);
    });

    $('#Donate100').click(function () {
        $('#mesageAmount').addClass('hidden');

        $("#AmountTextArea").attr("readonly", true).val(100);
    });

    $('#Donate500').click(function () {
        $('#mesageAmount').addClass('hidden');

        $("#AmountTextArea").attr("readonly", true).val(500);
    });

    $('#OtherAmount').click(function () {
        $("#AmountTextArea").attr("readonly", false).val('');
    });

    $('#emailAnonymous').on("keypress", function (e) {
        $(this).val($(this).val().trim());
        if (e.which === 32)
            return false;
    });

    $('#emailAnonymous').on("blur", function (e) {
        $(this).val($(this).val().trim());
    });

    $('#cancelConfirmation').click(function () {
        $("#ConfirmOnlineDonation").prop('disabled', false);
        $("#donationLoaders").html('');
    });

    $('#ConfirmOnlineDonation').click(function (e) {
        $(this).prop('disabled', true);
        $("#confirmOnlineDonation").css("z-index", "2147483642");
        var loader = $(document.createElement('img')).attr("src", '/images/loading2.gif').addClass("donationPopupLoader");
        //loader.attr("z-index", "10610000001");
        $("#donationLoaders").append(loader);
        e.preventDefault();
        let data = ObjectifyForm($('#OnlineDonationForm').serializeArray());
        let fd = new FormData();
        data.CaseId ? fd.append("CaseId", data.CaseId) : fd.append("CaseId", data.OnlineDonationCaseCode);
        fd.append("AddressAnonymous", data.AddressAnonymous);
        fd.append("Amount", data.Amount);
        fd.append("EmailAnonymous", data.EmailAnonymous);
        fd.append("NameAnonymous", data.NameAnonymous);
        fd.append("PhoneNumberAnonymous", data.PhoneNumberAnonymous);
        fd.append("DonationDestinationId", data.DonationDestinationId);
        fd.append("DonationDestinationSubId", data.DonationDestinationSubId);
        fd.append("DonationDestinationSubOfSubId", data.DonationDestinationSubOfSubId);
        fd.append("DonationDestinationIdd", data.DonationDestinationIdd);
        fd.append("paymentType", 50); //Cib
        $.ajax({
            cashe: false,
            url: "../Donation/AnonymousDonation",
            type: "POST",
            data: fd,
            contentType: false,
            processData: false,
            success: function (result) {
                let id = result.OrderId;
                let reference = parseInt(result.OrderId) + 1;
                let transactionId = result.TransactionId;
                Checkout.configure({ session: { id: result.session.id }
                });

                let confirmationData = { donationId: id, status: 6799, successIndicator: result.successIndicator, details: { DonatorEmail: result.DonatorEmail, referenceNumber: reference, Amount: data.Amount, Merchant: result.merchant, Currency: 'EGP', OrderInfo: id, TxnResponseCode: "0" } };
                localStorage.setItem("confirmDonationData", JSON.stringify(confirmationData));
                try { document.cookie = "confirmDonationData=" + encodeURIComponent(JSON.stringify(confirmationData)) + "; domain=.mersal-ngo.org; path=/; max-age=7200; secure; samesite=lax"; } catch (e) { }

                Checkout.showPaymentPage();
            },
            error: function (error) {
                toastr.error(error);
            }

        });

        var GetAllBanks = MersalWebAPIBaseUrl + "api/DonationBanks/DonationBanks";

        //    $.ajax({
        //        type: "GET",
        //        url: GetAllBanks,
        //        contentType: "application/json; charset=utf-8",
        //        dataType: "json",
        //        success: function (response) {

        //            //Clear all previous list of members  
        //            $("#MemberList").empty();

        //            //Display Asp.Net Web API response in console log   
        //            //You can see console log value in developer tool   
        //            //by pressing F12 function key.  
        //            console.log(response);


        //            // Variable created to store <li>Memeber Detail</li>  
        //            var ListValue = "";

        //            //Variable created to iterate the json array values.  
        //            var i;

        //            //Generic loop to iterate the response arrays.  
        //            for (i = 0; i < response.length; ++i) {
        //                ListValue += "<li>" + response[i].MemberName + " --- " + response[i].PhoneNumber
        //            }

        //            //Add/Append the formatted values of ListValue variable into ID called "MemberList"  
        //            $("#MemberList").append(ListValue);
        //        },
        //        failure: function (response) {
        //            alert(response.responseText);
        //            alert("Failure");
        //        },
        //        error: function (response) {
        //            alert(response);
        //            alert("Error");
        //        }
        //    });
        //});  

        //$.ajax({
        //    cashe: false,
        //    url: "https://cibpaynow.gateway.mastercard.com/api/rest/version/54/merchant/CIB700512/session",
        //    contentType: 'application/json; charset=iso-8859-1',
        //    contentlength: '110',
        //    requestId: '|f66c6518a7beb642a94e81781728f55a.852190c_4.',
        //    expect: '100 -continue',
        //    dataType: 'json',
        //    authorization: 'Basic bWVyY2hhbnQuQ0lCNzAwNTEyOjYzYzc2MmU3ZWUwNGQ5YWZiODk1NDdkZWEwYjE3ZDAw',
        //    host: 'cibpaynow.gateway.mastercard.com',
        //    data: JSON.stringify({ model: data }),
        //    type: 'POST',
        //    success: function (result) {
        //        console.log(result);
        //        let reference = parseInt("result",result) + 1;
        //        Checkout.configure({
        //            merchant: 'CIB700512',
        //            order: {
        //                amount: function () {
        //                    return data.Amount;
        //                },
        //                currency: 'EGP',
        //                description: 'Donation',
        //                id: result,
        //                reference: reference
        //            },
        //            interaction: {
        //                operation: 'PURCHASE', // set this field to 'PURCHASE' for Hosted Checkout to perform a Pay Operation.
        //                merchant: {
        //                    name: 'MERSAL CHARITY',
        //                }
        //            }
        //        });
        //        Checkout.showPaymentPage();
        //    },
        //    error: function (xhr) {
        //        console.log("erroe",xhr);
        //        toastr.error(xhr.statustext);
        //    }
        //});

        //$('#OnlineDonationForm').submit();
        //Checkout.showPaymentPage();
        //let id = Math.floor((Math.random() * 10) + 1);
        //let reference = Math.floor((Math.random() * 20) + 1);
        //let session = Math.floor(Math.random() * (100 - 31 + 1) + 31);


        //Checkout.showLightbox();
    });


    function ObjectifyForm(formArray) {

        var returnArray = {};
        for (var i = 0; i < formArray.length; i++) {
            returnArray[formArray[i]['name']] = formArray[i]['value'];
        }
        return returnArray;
    }

    /*CIB*/
    $('#onlineDonationSubmitBtn').click(function (e) {

        if ($('#OnlineDonationForm').valid()) {

            var newMessageContent = confirmDocationMessage.replace('{0}', $('#AmountTextArea').val() + " EGP");
            $('#confirmOnlineDonation').find('h4').html(newMessageContent);



            // To Do  check for pay type

            $('#confirmOnlineDonation').modal('show');
        }
    });

    /*    End CIB*/
    /* Outside Egypt*/
    $('#outsideDonationSubmitBtn').click(function (e) {

        if ($('#OnlineDonationForm').valid()) {

            var newMessageContent = confirmDocationMessage.replace('{0}', $('#AmountTextArea').val() + " USD");
            $('#outsideOnlineDonation').find('h4').html(newMessageContent);

            // To Do  check for pay type
            $('#outsideOnlineDonation').modal('show');
        }
    });

    $('#confirmoutsideOnlineDonation').click(function (e) {

        // New requierment to navigate outsite donation
        window.location.replace("https://www.every.org/mersal");

        //     $(this).prop('disabled', true);
        //     $("#confirmoutsideOnlineDonation").css("z-index", "2147483642");
        //     var loader = $(document.createElement('img')).attr("src", '/images/loading2.gif').addClass("donationPopupLoader");
        //     loader.attr("z-index", "10610000001");
        //     $("#donationLoaders").append(loader);
        //     let data = ObjectifyForm($('#OnlineDonationForm').serializeArray());
        //     let form = new FormData();
        //     data.CaseId ? form.append("CaseId", data.CaseId) : form.append("CaseId", data.OnlineDonationCaseCode);
        //     form.append("AddressAnonymous", data.AddressAnonymous);
        //     form.append("Amount", data.Amount);
        //     form.append("EmailAnonymous", data.EmailAnonymous);
        //     form.append("NameAnonymous", data.NameAnonymous);
        //     form.append("PhoneNumberAnonymous", data.PhoneNumberAnonymous);
        //     form.append("DonationDestinationId", data.DonationDestinationId);
        //     form.append("DonationDestinationSubId", data.DonationDestinationSubId);
        //     form.append("DonationDestinationSubOfSubId", data.DonationDestinationSubOfSubId);
        //     form.append("DonationDestinationIdd", data.DonationDestinationIdd);
        //     form.append("paymentType", 80);//outside egypt

        //    //  e.preventDefault();
        //     $.ajax({
        //         url: "../Donation/AnonymousOutsideDonation",
        //         type: 'Post',
        //         data: form,
        //         contentType: false,
        //         processData: false,
        //         beforeSend: function () {
        //             $("#imgAjaxLoader").show();
        //         },
        //         success: function (result) {
        //             clearForm();
        //             document.location.href = "/Donation/DonateOutsideEgypt" ; //'/Donation/NavigateToOutsidePage?amount=' + $('#AmountTextArea').val();
        //             $("#imgAjaxLoader").hide(); 
        //         },
        //         error: function (xhr) {
        //             $("#imgAjaxLoader").hide();
        //             toastr.error(xhr.statusText);
        //         }
        //     });
    });

    function clearForm() {
        $("#AmountTextArea").text('');
        $("#AddressAnonymous").text('');
        $("#EmailAnonymous").text('');
        $("#PhoneNumberAnonymous").text('');
    }
    var GetConfigrations = MersalWebAPIBaseUrl + "api/Donation/OutSideConfigration";
    $.ajax({
        url: GetConfigrations,
        type: 'Get',
        contentType: false,
        processData: false,
        beforeSend: function () {

            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            if (result != null) {
                var showOutsideSection = result.ShowOutSideDonation;
                if (showOutsideSection) {
                    //  $("#outsideDonationSubmitBtn").show();
                }
            }
            $("#imgAjaxLoader").hide();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
    function DonateOutsideEgypt() {
        console.log(e);
    }
    //toggle currency and show button

    var outSide = false;

    $('#outside').click(function () {
        outSide = true;
        if ($("#outside").hasClass("active")) {
            // $("#outside").removeClass("active");

        } else {
            $("#outside").addClass("active");
            $("#inside").removeClass("active");

        }
    });


    $('#inside').click(function () {
        outSide = false;
        if ($("#inside").hasClass("active")) {
            // $("#inside").removeClass("active");
        } else {
            $("#inside").addClass("active");
            $("#outside").removeClass("active");

        }
    });



    $('#OutSideChecked').click(function () {

        if (outSide) {
            $("#OnlineDonationTabs").addClass("reverse-text-direction");
            document.getElementById("curr").innerHTML = 'USD';
            document.getElementById("curr1").innerHTML = 'USD';
            document.getElementById("curr2").innerHTML = 'USD';
            document.getElementById("curr3").innerHTML = 'USD';
            document.getElementById("curr4").innerHTML = 'USD';
            // $('#OutSideChecked').html('Donate From Egypt');

            $("#OutsideSection").show();
            $("#OnlineSection").hide();
            $("#FawerySection").hide();

        } else {
            $("#OnlineDonationTabs").removeClass("reverse-text-direction");
            document.getElementById("curr").innerHTML = 'EGP';
            document.getElementById("curr1").innerHTML = 'EGP';
            document.getElementById("curr2").innerHTML = 'EGP';
            document.getElementById("curr3").innerHTML = 'EGP';
            document.getElementById("curr4").innerHTML = 'EGP';
            // $('#OutSideChecked').html('Donate Outside Egypt');
            $("#OutsideSection").hide();
            $("#OnlineSection").show();
            $("#FawerySection").show();

        }
    });
    /*End Outside Egypt*/


    /* Fawry Card*/


    $('#CancelOnlineDonationFawryCard').click(function () {
        $("#confirmOnlineDonationFawryCardModal").prop('disabled', false);
        $("#donationLoaders").html('');
    });


    $('#FawryCardonlineDonationSubmitBtn').click(function (e) {

        if ($('#OnlineDonationForm').valid()) {

            var newMessageContent = confirmDocationMessage.replace('{0}', $('#AmountTextArea').val() + " EGP");
            $('#confirmOnlineDonationFawryCardModal').find('h4').html(newMessageContent);
            $('#confirmOnlineDonationFawryCardModal').modal('show');
        }
    });

    $('#confirmOnlineDonationFawryCard').click(function (e) {
        // To Do open fawry payment
        ExcuteDontion(e)
        // var GetAllBanks = MersalWebAPIBaseUrl + "api/DonationBanks/DonationBanks";
    });


    function ExcuteDontion(e) {

        $(this).prop('disabled', true);
        $("#confirmOnlineDonationFawryCard").css("z-index", "2147483642");
        var loader = $(document.createElement('img')).attr("src", '/images/loading2.gif').addClass("donationPopupLoader");
        //loader.attr("z-index", "10610000001");
        $("#donationLoaders").append(loader);
        e.preventDefault();
        let data = ObjectifyForm($('#OnlineDonationForm').serializeArray());

        data.CaseId ? data.CaseId = data.CaseId : data.CaseId = data.OnlineDonationCaseCode;
        data.paymentType = 60;
        let form = new FormData();
        // data.CaseId ? form.append("CaseId",data.CaseId) : form.append("CaseId", data.OnlineDonationCaseCode);
        //form.append("AddressAnonymous", data.AddressAnonymous);
        //form.append("Amount", data.Amount);
        //form.append("EmailAnonymous", data.EmailAnonymous);
        //form.append("NameAnonymous", data.NameAnonymous);
        //form.append("PhoneNumberAnonymous", data.PhoneNumberAnonymous);
        //form.append("DonationDestinationId", data.DonationDestinationId);
        //form.append("DonationDestinationSubId", data.DonationDestinationSubId);
        //form.append("DonationDestinationSubOfSubId", data.DonationDestinationSubOfSubId);
        //form.append("DonationDestinationIdd", data.DonationDestinationIdd);
        //form.append("paymentType", 60); //60 Fawry
        debugger
        $.ajax({
            cashe: false,
            async: true,
            url: "../OnlineDonation/AnonymousDonationFawry",
            type: "POST",
            headers: getHeaders(),
            data: JSON.stringify(data),
            contentType: 'application/json; charset=utf-8',
            processData: false,
            success: function (result) {




                localStorage.setItem("confirmDonationDataFawry", JSON.stringify(result));
                // $('#confirmOnlineDonationFawryCard').one('click', clickHandler);
                //window.location.href ="../OnlineDonation/FawryPayment"
                //Checkout.showPaymentPage();
                AppendDontionData();

            },
            error: function (error) {
                toastr.error(error);
            }

        });
    }

    /* End Fawry Card*/




});
