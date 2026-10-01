
var SystmeCodeWebAPIBaseUrl = "http://localhost:2626/";
var MersalWebAPIBaseUrl = "http://localhost:22782/";

var APIBaseUrl = "http://35.188.232.237:5050/MersalAPI/";
//var APIBaseUrl = "http://localhost:22782/MersalAPI/";

var UserNamagementWebAPIBaseUrl = "http://localhost:11931/";
var NotificationAPIBaseUrl = "http://localhost:3163/";

var SystmeCodeUIUrl = "http://localhost:2634/";
var UserNamagementUIUrl = "http://localhost:2633/";




function getCookie(c_name) {
    var i, x, y, ARRcookies = document.cookie.split(";");

    for (i = 0; i < ARRcookies.length; i++) {
        x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
        y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
        x = x.replace(/^\s+|\s+$/g, "");
        if (x == c_name) {
            return unescape(y);
        }
    }
}
var _culture = getCookie("_culture");
if (_culture == null) {
    _culture = "ar-SA";
}
var _cultureIsArabic = true;
if (_culture === "en-US") {
    _cultureIsArabic = false;
}

if (_cultureIsArabic) {
    var SuccessfulProcess  = "تمت العملية بنجاح";
    var SuccessfullyAdd = "تمت الإضافة بنجاح";
    var ErrorMessage = "حدث خطاء";
    var CaseCode = "كود الحالة";
    var Code = "الكود";
    var CaseName = "اسم الحالة";
    var Description = "الوصف";
    var TitleEnglish = "العنوان بالأنجليزى";
    var TitleArabic="العنوان بالعربى";
    var CreatedOn = "تاريخ الاضافة";
    var PleaseAddComment = "من فضلك اضف تعليق"
    var SuccessfullyAccept = "تم القبول بنجاح";
    var SuccessfullyReject = "تم الرفض بنجاح";
    var SuccessfullyAssginCaseToInvestigetor = "تمت الإحالة للمحقق بنجاح";
    var ExeportToExcel = "تصدير لإكسل ";
    var DragaColumnHeaderAndDropItHereToGroupByThatColumn = "اسحب عنوان العمود وأسقطه هنا لعمل مجموعات حسب هذا العمود";
    var caseHoverText = "تفاصيل الحالة";
    var Donate = "تبرع";
    var Goal = "الهدف";
    var Remaining = "المتبقي";
    var ValueAmount = "المبلغ";
    var AccountName = "إسم الحساب";
    var PleaseAddValueAmount = "من فضلك اضف المبلغ";
    var DonateNow = "تبرع الأن";
    var moneyWanted = "المطلوب";
    var SuccessfullyRemoved = "تم الحذف بنجاح";
    var TransferNumber = "رقم التحويل";
    var DonationName = "اسم التبرع";
    var DonationTypeAr = "نوع التبرع";
    var PaymentType = 'نوع الدفع';
    var Phonex = 'رقم التليفون';

}
else {
    var SuccessfulProcess = "Successful Process"; 


    var SuccessfullyAdd = "Successfully Added";
    var ErrorMessage = "Error";
    var CaseCode = "Case Code";
    var Code = "Code";
    var CaseName = "Case Name";
    var Description = "Description";
    var CreatedOn = "Created On";
    var TitleEnglish = "Title English";
    var TitleArabic = "Title Arabic";
    var PleaseAddComment = "Please Add Comment"
    var SuccessfullyAccept = "Successfully Accept";
    var SuccessfullyReject = "Successfully Reject";
    var SuccessfullyAssginCaseToInvestigetor = "Successfully Assgin Case To Investigetor";
    var ExeportToExcel = " Exeport To Excel";
    var DragaColumnHeaderAndDropItHereToGroupByThatColumn = "Drag a column header and drop it here to group by that column";
    var caseHoverText = "Case Details";
    var Donate = "Donate"; 
    var Goal = "Goal";
    var Remaining = "Remaining";
    var ValueAmount = "Value Amount";
    var AccountName = "Account Name";
    var TransferNumber = "Transfer Number";
    var DonationName = "DonationName";
    var PleaseAddValueAmount = "Please Add Value Amount";
    var DonateNow = "Donate Now";
    var moneyWanted = "Money Wanted";
    var SuccessfullyRemoved = "Successfully Removed";
    var DonationTypeAr = "Donation Type";
    var PaymentType = 'PaymentType';
    var Phone = 'Phone number';

}


