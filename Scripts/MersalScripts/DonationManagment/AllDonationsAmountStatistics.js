
var html = '';
//var  Url = MersalWebAPIBaseUrl + "api/DonationStatistics/GetAll?IsDeleted=False";
//$(function () {
//    $.ajax({
//        cashe: false,
//        url: Url,
//        type: "GET",
//        contentType: false,
//        processData: false,
//        success: function (result) {
//             for (let i = 0; i < result.length; i++) {

//               if (result[i].Code=="ChildrenCases" || result[i].Code=="OpenHeartCases" || result[i].Code=="TotalDonations") {
//                let mum =parseInt(result[i].Value.replaceAll(',',''));


//                html +=`<div class="col-lg-4 col-md-12 row">
//                <div class="col-6">
//                  <a href="/Donation"><h1  id="countValue${i+1}">${result[i].Value} </h1></a>
//                </div>
//                <div class="col-6">
//                  <h6 > ${_cultureIsArabic?result[i].NameArabic:result[i].NameEnglish} </h6>
//                  <span id="countValue${i+1}">${result[i].TargetValue} ${_cultureIsArabic?'جنيه':'Pound'}</span>
//                </div>
//              </div>`;
//                $("#DonationSection").hover(function () {
//              animateValue(`countValue${i+1}`,parseInt(result[i].Value.replaceAll(',',''))-20, parseInt(result[i].Value.replaceAll(',','')), 3000);

//             });
//               }
//             }
//          $("#donationsCounters").html(html);
//        },
//        error: function (error) {
//            toastr.error(error);
//        }

//    });
//});


// {
//     "Id": 2,
//     "TitleEn": "feeding",
//     "TitleAr": "الإطعام",
//     "DescriptionEn": "feeding",
//     "DescriptionAr": "الإطعام",
//     "GoalTotal": "50000 وجبة",
//     "GoalUnit": "وجبة",
//     "GoalAverageAmount": 45,
//     "AchievedAmount": 0
// },



var Url = MersalWebAPIBaseUrl + "api/CampaignsHomeCounter/GetAllCampaignsDonationsAmount";
$(function () {
    $.ajax({
        cashe: false,
        url: Url,
        type: "GET",
        headers: getHeaders(),
        contentType: false,
        processData: false,
        success: function (result) {
             for (let i = 0; i < result.length; i++) {
                var achieved = isNaN(result[i].AchievedAmount) ? 0 : parseInt(result[i].AchievedAmount)
                html += `
                <div class="donation-counter-card">
                <a href="/DynamicPage/RenderPage?id=${result[i].ProjectDestinationId}">
                 <img src="${ result[i].ImageURL != null && result[i].ImageURL != ""? result[i].ImageURL : 'https://mersal-ngo.org/ClientFilesLayout/CasesImage/thumbnails/mersalLogo.png'}" alt="" srcset=""></a>
                <div class="counter-card-content">
                <a href="/DynamicPage/RenderPage?id=${result[i].ProjectDestinationId}">
                <h4>${_cultureIsArabic ? result[i].TitleAr : result[i].TitleEn}</h4>
                    <div class="average">
                        <p>${_cultureIsArabic?'متوسط':'Average'} ${result[i].GoalUnit}</p>
                        <p> ${result[i].GoalAverageAmount}</p>
                    </div>
                    <div class="descriptions">
                        <p>${_cultureIsArabic ? result[i].DescriptionAr.substring(0, 100) : result[i].DescriptionEn.substring(0, 100)}</p>
                    </div>
                    <div class="indicator">
                        <div class="Progress">
                             <div class="Bar" data-value="${(achieved / parseInt(result[i].GoalTotal))*100}">
                                  <div class="persent">${achieved } </div>
                              </div>
                                <div class="pct"> ${_cultureIsArabic?'الهدف':'Target'}   ${parseInt(result[i].GoalTotal)} </div>
                                <div class="name"> ${_cultureIsArabic?'تم توفير ':'been provided'}  ${isNaN(result[i].AchievedAmount ) ? 0 : parseInt(result[i].AchievedAmount)}</div>

                        </div>



                    </div>
                    </a>
                        <a  class="home-donate" href="/Donation?donationDestID=${result[i].DonationDestinationId}">${_cultureIsArabic ? 'تبرع الآن' : 'Donate'}</a>
                </div>
                </div>`;

                
            }
            $("#donationsCounters").html(html);
            $(".Bar").each(function () {
                let percent = $(this).attr('data-value');
                $(this).children().first().css('margin-right', parseFloat(percent)+5 + 'px');
                //For too high values :
                if (percent > 100) {
                    percent = 100;
                }

                $(this).css('width', percent+'%' );

                //With animation as asked :
                $(this).animate({ width: percent + '%' }, 2000);
            });
        },
        error: function (error) {
            toastr.error(error);
        }

    });
});


// `
//            <div class="col-lg-6 col-md-12 item">
//                 <div class="right-section">
//                     <h4>${_cultureIsArabic ? result[i].TitleAr : result[i].TitleEn}</h4>
//                     <p>
//                     <span>متوسط</span> ${result[i].GoalUnit} : ${result[i].GoalAverageAmount}
//                     </p>
//                 </div>
//                 <div class="left-section">
//                     <p class="wanted">
//                     <span> المطلوب</span> : <span> ${result[i].GoalTotal} </span>
//                     </p>
//                     <p class="achieved">
//                     <span> تم توفير</span> : <span> ${result[i].AchievedAmount} </span>
//                     </p>
//                 </div>
//             </div> 
//                 `


function animateValue(id, start, end, duration) {
    if (start === end) return;
    var range = end - start;
    var current = start;
    var increment = end > start ? 1 : -1;
    var stepTime = Math.abs(Math.floor(duration / range));
    var obj = document.getElementById(id);
    var timer = setInterval(function () {
        current += increment;
        obj.innerHTML = current;
        if (current == end) {
            clearInterval(timer);

            let coma = numberWithCommas(current);
            obj.innerHTML = coma;

        }
    }, stepTime);
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

