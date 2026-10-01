var Data;

function checkout() {
    const configuration = {
        locale: "en", //default en, allowed [ar, en]
        divSelector: 'fawry-UAT', //required and you can change it as desired
        mode: DISPLAY_MODE.SEPARATED, //required, allowd values [POPUP, INSIDE_PAGE, SIDE_PAGE, SEPARATED]
        onSuccess: successCallBack, //optional and not supported with separated display mode
        onFailure: failureCallBack, //optional and not supported with separated display mode
    };

    FawryPay.checkout(buildChargeRequest(), configuration);
}





function buildChargeRequest() {
    const chargeRequest = JSON.parse(Data);
    
    return chargeRequest;
}

function successCallBack(data) {
    console.log('handle success call back as desired, data', data);
    document.getElementById('fawryPayPaymentFrame')?.remove();
}

function failureCallBack(data) {
    console.log('handle failure call back as desired, data', data);
    document.getElementById('fawryPayPaymentFrame')?.remove();
}

 

function AppendDontionData()
{
    var Storage = JSON.parse(localStorage.getItem("confirmDonationDataFawry"));
    var DontionId = Storage ;
    
    $.ajax({
        cashe: false,
        url: "../OnlineDonation/FawryGetBulidRequst?DontionId=" + DontionId,
        type: "Get",
        headers: getHeaders(),
        datatype: "Json",
        async:true,
        success: function (result) {
         
            Data = result;
            console.log(Data);

            localStorage.setItem("confirmDonationDataFawry", "")
            //$("#fawry-payment-btn").click()
            checkout();
        },
        error: function (error) {
            toastr.error(error);
        }

    });



   // $("#Name").text(data.details.)
}


//$(document).ready(function () {
//    //AppendDontionData();
     
  
//});