function DrawSlider(json) {

    var html = '';
    var template1 = ' <div class="ls-slide" data-ls="transition2d:#animation#; timeshift:-#timeShift#;">' +
                   ' <img itemprop="image" src="#src#" class="ls-bg" alt="Slide background" />' +
                     '   <div class="ls-l slide-title" style="top:#titletop#;left:#titleleft#;font-size:#titlefontsiz#;font-weight:600;" data-ls="offsetyin:50px;offsetxin:0;durationin:1500;delayin:400;easingin:easeOutBack;">#titletext#</div>' +
                      ' <div class="ls-l slide-subtitle" style="top:#subtitletop#;left:#subtitleleft#;font-size:#subtitlefontsiz#" data-ls="offsetyin:-50px;offsetxin:0;durationin:1500;delayin:800;">#subtitletext#</div>'
                   + '  <div class="ls-l slide-text" style="top:#slidetexttop#;left:#slidetextleft#;font-size:#slidetextfontsize#;" data-ls="offsetyin:50px;offsetxin:0;durationin:1500;delayin:1200;">#slidetexttext#</div>'
                    + ' <a itemprop="url" href="#hrefurl#" title="" class="ls-l slide-button" style="top:#hreftop#;left:#hrefleft#;font-size:#hreffontsize#;padding:18px 55px;" data-ls="durationin:1500;delayin:2000;easingin:easeOutBack;offsetyin:-50px;offsetxin:0;">#hreftext#</a>'
                    + '</div>';

    var template2 = ' <div class="ls-slide" data-ls="transition2d:#animation#; timeshift:-#timeShift#;">  '
                            + '<img itemprop="image" src="#src#" class="ls-bg" alt="Slide background" />'
                              + ' <div class="ls-l slide-text" style="top:#titletop#;left:#titleleft#;font-size:#titlefontsiz#;" data-ls="offsetxin:0;durationin:4000;delayin:500;rotatexin:450;transformoriginin:left 50% 0;offsetxout:0;durationout:500;easingout:easeInBack;rotateyout:90;transformoriginout:left 50% 0;">#titletext#</div> '
                               + ' <div class="ls-l slide-title" style="top:#subtitletop#;left:#subtitleleft#;font-size:#subtitlefontsiz#" data-ls="offsetxin:0;durationin:4000;delayin:800;rotatexin:450;transformoriginin:right 50% 0;offsetxout:0;durationout:500;easingout:easeInBack;rotateyout:-90;transformoriginout:right 50% 0;">#subtitletext#</div>'
                         + '<a  itemprop="url" href="#hrefurl#" title="" class="ls-l slide-button #Remove#" style="top:#hreftop#;left:#hrefleft#;font-size:#hreffontsize#;padding:18px 55px;" data-ls="offsetxin:0;durationin:4000;delayin:700;rotatexin:450;transformoriginin:left 50% 0;offsetxout:0;durationout:500;easingout:easeInBack;rotateyout:90;transformoriginout:left 50% 0;">#hreftext#</a>  '
                          + ' </div> ';
    var template4 = ' <div class="ls-slide" data-ls="transition2d:#animation#; timeshift:-#timeShift#;">  '
                          + '<img itemprop="image" src="#src#" class="ls-bg" alt="Slide background" />'
                            + ' <div class="ls-l slide-text" style="top:#titletop#;left:#titleleft#;font-size:#titlefontsiz#;" data-ls="offsetxin:0;durationin:4000;delayin:500;rotatexin:450;transformoriginin:left 50% 0;offsetxout:0;durationout:500;easingout:easeInBack;rotateyout:90;transformoriginout:left 50% 0;">#titletext#</div> '
                             + ' <div class="ls-l slide-title" style="top:#subtitletop#;left:#subtitleleft#;font-size:#subtitlefontsiz#" data-ls="offsetxin:0;durationin:4000;delayin:800;rotatexin:450;transformoriginin:right 50% 0;offsetxout:0;durationout:500;easingout:easeInBack;rotateyout:-90;transformoriginout:right 50% 0;">#subtitletext#</div>'
                        + ' </div> ';
    var template3 = '<div class="ls-slide" data-ls="transition2d:#animation#; timeshift:-#timeShift#;"> '
                            + '    <img itemprop="~/image" src="#src#" class="ls-bg" alt="Slide background" />  '
                         + '      <div class="ls-l slide-subtitle" style="top:#subtitletop#;left:#slidetextleft#;font-size:#subtitlefontsiz#;" data-ls="offsetxin:-50;durationin:2000;delayin:500;offsetxout:-50;durationout:1000;">#subtitletext#</div> '
                         + '      <div class="ls-l slide-title" style="top:#titletop#;left:#titleleft#;font-size:#titlefontsiz#;font-weight:600;" data-ls="offsetxin:0;durationin:2500;delayin:900;scalexin:0;scaleyin:0;offsetxout:0;scalexout:0;scaleyout:0;">#titletext#</div>          '
                         + '      <div class="ls-l blackbox" style="top:#slidetexttop#;left:#slidetextleft#;font-size:#subtitlefontsiz#;padding:20px 40px;" data-ls="offsetxin:50;delayin:1200;skewxin:-60;offsetxout:-50;durationout:1000;skewxout:-60;">#slidetexttext#</div>     '
                         + '  </div>                                                                                                                                                                                                                                  ';
   var template5 = '<div class="ls-slide" data-ls="transition2d:12; timeshift:-1000;">' + 
                            '<img itemprop="image" src="#src#" class="ls-bg" alt="Slide background" style="" />' +
                            '<div class="ls-l slide-text" style="top:140px;left:50%;font-size:58px;" data-ls="offsetxin:0;durationin:4000;delayin:500;rotatexin:450;transformoriginin:left 50% 0;offsetxout:0;durationout:500;easingout:easeInBack;rotateyout:90;transformoriginout:left 50% 0;">#titletext#</div>'+ 
                            '<div class="ls-l slide-title" style="top: 230px; left: 24%; text-align: center; font-size: 25px; width: 55%; line-height: 1.2;" data-ls="offsetxin:0;durationin:4000;delayin:800;rotatexin:450;transformoriginin:right 50% 0;offsetxout:0;durationout:500;easingout:easeInBack;rotateyout:-90;transformoriginout:right 50% 0;">#subtitletext#</div></div>';  

   var template6 = '<div class="ls-slide" data-ls="transition2d:12; timeshift:-1000;">' +
                        '<img itemprop="image" src="#src#" class="ls-bg" alt="Slide background" style="" />' +
                        '<div class="ls-l slide-text" style="top:140px;left: 50%; font-size: 36px;" data-ls="offsetxin:0;durationin:4000;delayin:500;rotatexin:450;transformoriginin:left 50% 0;offsetxout:0;durationout:500;easingout:easeInBack;rotateyout:90;transformoriginout:left 50% 0;">#titletext#</div>' +
                        '<div class="ls-l slide-title" style="top: 230px; left: 24%; text-align: center; font-size: 25px; width: 80%; line-height: 1.2; " data-ls="offsetxin:0;durationin:4000;delayin:800;rotatexin:450;transformoriginin:right 50% 0;offsetxout:0;durationout:500;easingout:easeInBack;rotateyout:-90;transformoriginout:right 50% 0;">#subtitletext#</div>' +
               '<a itemprop="url" href="#hrefurl#" title="" class="ls-l slide-button" style="top: 397px;left:50%;font-size:13px;padding:14px 40px;" data-ls="offsetxin:0;durationin:4000;delayin:700;rotatexin:450;transformoriginin:left 50% 0;offsetxout:0;durationout:500;easingout:easeInBack;rotateyout:90;transformoriginout:left 50% 0;">#hreftext#</a></div>';


    for (var i = 0; i < json.length; i++) {
        if (_cultureIsArabic) {
            json[i].Title = json[i].TitleAr;
            json[i].Subtitle = json[i].SubTitleAr;
            json[i].HrefText = json[i].HrefTextAr;
        } 
        if (json[i].HrefText == "") {
            var res = template5
                       .replace("#src#", json[i].ImagePath)
                       .replace("#titletext#", json[i].Title)
                       .replace("#subtitletext#", json[i].Subtitle) 
        }
        else 
        {
            var res = template6
                        .replace("#src#", json[i].ImagePath)
                        .replace("#titletext#", json[i].Title)
                        .replace("#subtitletext#", json[i].Subtitle)
                        .replace("#hrefurl#", json[i].HrefUrl)
                        .replace("#hreftext#", json[i].HrefText); 
        } 
        html += res;
    }
    $("#layerslider").append(html); 
    $("a[href='null'").remove();
}

$(document).ready(function () {
    var url = MersalWebAPIBaseUrl + "api/HomeSlider/GetAllHomeSliderHomeView";
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: url,
        async: false,
        headers: getHeaders(),
        success: function (data) {
            DrawSlider(data)
        },
        erro: function (xhr) {
            toastr.error(xhr.statusText);
        }
    }); 
})


