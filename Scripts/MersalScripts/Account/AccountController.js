function FullDRP(MasterCode, dropDownListId, enableAll) {

    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetMasterCodeByMultiCode?masterCode=" + MasterCode,
        async: true,
        headers: getHeaders(),
        success: function (data) {

            var html = "";

            if (_cultureIsArabic) {
                html = "<option value='0'>اختر</option>";
            }
            else {
                html = "<option value='0'>select</option>";
            }

            $.each(data, function (key, value) {
                if (value.masterCodeValue == MasterCode) {
                    if (_cultureIsArabic) {
                        html += "<option Code=" + value.Code + " value=" + value.Id + "  >" + value.NameAr + "</option>";
                    }
                    else {
                        html += "<option Code=" + value.Code + " value=" + value.Id + " >" + value.NameEn + "</option>";
                    }
                }
            });
            

            $("#" + dropDownListId).html(html);
            $("#ProjectId").val(EditAccount.ProjectId);
            $("#TypeId").val(EditAccount.TypeId);
        },
        error: function (xhr) { 
toastr.error(xhr.statusText);
        }
    });
}
var parentAccountID = 0;
function HideAnyModal() {
    $(".modal").modal("hide");
}

function MakeTree() {
    $('.tree').tree_structure({
        'add_option': false,
        'edit_option': false,
        'delete_option': false,
        'confirm_before_delete': false,
        'animate_option': false,
        'fullwidth_option': false,
        'align_option': 'center',
        'draggable_option': true
    });
    //$(".thide").hide()
}
$(document).ready(function () {
    //MakeTree()
    GetAndDrawAccountTree()
});
var accountArray = [];
function GetAndDrawAccountTree() {
    var apiurl = MersalWebAPIBaseUrl + "api/Accounts/GetAllAccount";
    $.ajax({
        type: "get",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),

        async: false,
        success: function (data) {
         
            accountArray = data;

            DrawTree(data)
        },
        error: function (xhr) {


            toastr.error(xhr.error); 
        }
    });

}
function DrawTree(json) {

    var html = "";
    for (var i = 0; i < json.length; i++) {
        if (json[i].ParentId == null) {
            html += " <li><div style='cursor: pointer;'accountName=" + json[i].Name + "  balance=" + json[i].CurrentBalanc + " id=" + json[i].Id + " >" + name + " : " + json[i].Name + "<br/> " + currentBalance + ": " + json[i].CurrentBalanc + "<br /><a href='#' class='hrefPopup' style='float: right;'  onclick='AddAccountNode(" + accountArray[i].Id + ")'>" + AddSTR + "</a><a href='#' class='hrefPopup' style='float:right;padding-right: 9%;'  onclick='AddTransactionCall(" + accountArray[i].Id + ")'>" + AddTransactionSTR + " </a><a href='#' class='hrefPopup' style='float: left;'  onclick='EditAccountCall(" + accountArray[i].Id + ")'>" + EditSTR + "</a></div>"
            html += "<ul> " + GetChild(json[i].Id) + " </ul>";
            Nodhtml = "";
            html += "  </li>";
        }
    } 
    $("#TreeTop").html(html);
    MakeTree();
    accountArray = [];
}

var Nodhtml = "";
function GetChild(id) {
    for (var i = 0; i < accountArray.length; i++) {
        if (accountArray[i].ParentId == id) {
            Nodhtml += " <li><div style='cursor: pointer;' accountName=" + accountArray[i].Name + " balance=" + accountArray[i].CurrentBalanc + " id=" + accountArray[i].Id + " >" + name + " : " + accountArray[i].Name + "<br/> " + currentBalance + ": " + accountArray[i].CurrentBalanc + "<br /><a href='#' class='hrefPopup' style='float: right;' onclick='AddAccountNode(" + accountArray[i].Id + ")'>" + AddSTR + "</a><a href='#' class='hrefPopup' style='float:right;padding-right: 9%;'  onclick='AddTransactionCall(" + accountArray[i].Id + ")'>" + AddTransactionSTR + "</a><a href='#' class='hrefPopup' style='float: left;' onclick='EditAccountCall(" + accountArray[i].Id + ")'>" + EditSTR + "</a></div> "
            if (accountArray[i].IsEnd == false) {
                Nodhtml += "<ul> "
                GetChild(accountArray[i].Id)
                Nodhtml += " </ul>";
            }
            Nodhtml += "  </li>";
        }

    }
    return Nodhtml;
}
function AddAccountNode(AccountID) {



    getCreate()
    parentAccountID = AccountID;

}
var transactionAccountId = 0;
function AddTransactionCall(AccountID) {
    transactionAccountId = AccountID
    getCreateTransactionView();
}
function getCreateTransactionView() {

    $.ajax({
        url: "/AccountTransaction/Create",
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            //$("#imgAjaxLoader").show();
        },
        success: function (result) {

            $("#AddAccountModal").html(result);
            $("#AddAccountModal").modal("show");

            if (EditAccount != {}) {
                BindEditAccount(EditAccount)
            }

        },
        error: function (xhr) {
            //$("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}
function EditAccountCall(Id) {


    if (Id != undefined) {
        getEdit();
        GetAndAccountDetalis(Id);
        //parentAccountID = Id;
    }
}
var EditAccount = {};
function GetAndAccountDetalis(Id) {
    var apiurl = MersalWebAPIBaseUrl + "api/Accounts/GetAccountByID?Id=" + Id;
    $.ajax({
        type: "get",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),

        //async: false,
        success: function (data) {

            EditAccount = data;
            BindEditAccount(data)
        },
        error: function (xhr) {


            toastr.error(xhr.error); 
        }
    });

}

function BindEditAccount(DTO) {
    
    $("#Name").val(DTO.Name);

    $("#CurrentBalanc").val(DTO.CurrentBalanc);
    $("#Description").val(DTO.Description);
    $("#Id").val(DTO.Id);
    if (DTO.IsActive == false) {
        $("#IsActive").prop("checked", false)
    }

    $("#Name").val(DTO.Name);
    $("#OpeningBalance").val(DTO.OpeningBalance);
    $("#ParentId").val(DTO.ParentId);
    $("#ProjectId").val(DTO.ProjectId);
    $("#TypeId").val(DTO.TypeId);

    if (DTO.BankDetailsDTO != null) {
        $("#bankDetails").show("slide")
        isBank = true;
        $("#BankDetailsDTO_Name").val(DTO.BankDetailsDTO.Name)
        $("#BankDetailsDTO_AccountNumber").val(DTO.BankDetailsDTO.AccountNumber)
        $("#BankDetailsDTO_Location").val(DTO.BankDetailsDTO.Location)
        $("#BankDetailsDTO_Details").val(DTO.BankDetailsDTO.Details)
    }
}

function getCreate() {

    $.ajax({
        url: "/MersalAccount/Create",
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            //$("#imgAjaxLoader").show();
        },
        success: function (result) {

            $("#AddAccountModal").html(result);
            $("#AddAccountModal").modal("show");

        },
        error: function (xhr) {
            //$("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}
function getTransfer(idFrom,idTO) {
    
    $.ajax({
        url: "/AccountTransaction/Transfer",
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            //$("#imgAjaxLoader").show();
        },
        success: function (result) {

            $("#AddAccountModal").html(result);
            $("#AddAccountModal").modal("show");

        },
        error: function (xhr) {
            //$("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}
function getEdit() {

    $.ajax({
        url: "/MersalAccount/Edit",
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            //$("#imgAjaxLoader").show();
        },
        success: function (result) {

            $("#AddAccountModal").html(result);
            $("#AddAccountModal").modal("show");

            if (EditAccount != {}) {
                BindEditAccount(EditAccount)
            }

        },
        error: function (xhr) {
            //$("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}