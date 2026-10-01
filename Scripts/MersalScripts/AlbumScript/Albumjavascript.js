

var GetAlbumURL = MersalWebAPIBaseUrl + "api/Albums/GetAllAlbums";

// kendo grid
$(function () {
    $('.modal').on('hide.bs.modal', function () {
        try { 
            $("#grid").data("kendoGrid").dataSource.read();
        } catch (e) {

        }
    });

    var dataSource = new kendo.data.DataSource({
        transport: {
            read: {
                url: GetAlbumURL,
                dataType: "json",
                headers: getHeaders(),
            },
            parameterMap: function (options, type) {
                return options;
            },
        },
        schema: {
            total: function (data) {
                return data.Total;

            },
            data: function (data) {

                return data.Data;
            },

            model: {
                Id: "Id",
                fields: {
                    Id: { type: "number" },
                    TitleEn: { type: "string" },
                    TitleAr: { type: "string" },
                    CreatedOn: { type: "date" },
                    // ValueAmount: { type: "number" },

                }
            }
        },
        type: "json",
        pageSize: 10,
        serverPaging: true,
        serverFiltering: true,
        serverSorting: true
    });



    $("#grid").kendoGrid({

        toolbar: [{
            name: "excel",
            text: ExeportToExcel,
        }],
        excel: {
            fileName: "List Of Albums.xlsx",
            allPages: true,
            filterable: false

        },
        dataSource: dataSource,
        //filterable: {
        //    extra: false
        //},
        filterable: false,

        sortable: true,
        pageable: {
            messages: {
                //itemsPerPage: '@SystemCodesResources.ItemsPerPage',
                //display: '@SystemCodesResources.Items',
                //page: '@SystemCodesResources.Page',
                //of: '@SystemCodesResources.Of',
                //empty: '@SystemCodesResources.Empty'

                itemsPerPage: '',
                display: '',
                page: '',
                of: '',
                empty: ''
            },

            refresh: true,
            pageSizes: true,
            buttonCount: 5
        },
        resizable: true,
        width: '100%',
        sortable: false,
        groupable: {
            messages: {
                empty: DragaColumnHeaderAndDropItHereToGroupByThatColumn,//Drag a column header and drop it here to group by that column"
            }
        },
        columns: [
            {
                field: "Id",
                title: 'Id',
                filterable: false,
                hidden: true,
            },
            {
                field: "TitleEn",
                title:  TitleEnglish ,

            },
            {
                field: "TitleAr",
                title: TitleArabic,
            },
            {
                field: "CreatedOn",
                title: CreatedOn,
                type: "date",
                format: "{0:d/M/yyyy h:mm}",
                parseFormats: ["MM/dd/yyyy h:mm:ss"],
            },

        {
            command: [
                {
                    name: "details",
                    text: "",
                    iconClass: "fa  fa-info-circle",
                    click: function (e) {
                        var tr = $(e.target).closest("tr");
                        var dataRow = this.dataItem(tr);
                        var rowIdx = $("tr", grid.tbody).index(tr);
                        getAlbumDetails(dataRow.Id, rowIdx);//getAlbumDetails
                    }
                },
                {
                    name: "delete",
                    text: "",
                    iconClass: "fa fa-trash-o",
                    click: function (e) {
                        var tr = $(e.target).closest("tr");
                        var dataRow = this.dataItem(tr);
                        var rowIdx = $("tr", grid.tbody).index(tr);
                        DeleteAlbum(dataRow.Id);
                    }
                },
                     {
                         name: "ShowAlbumImages",
                         text: images,
                         click: function (e) {
                             var tr = $(e.target).closest("tr");
                             var dataRow = this.dataItem(tr);
                             var rowIdx = $("tr", grid.tbody).index(tr);
                             //getAlbumImages(dataRow.Id, rowIdx);
                             window.location.href = "/Album/GetAlbumImagesByAdmin/" + dataRow.Id;


                         }
                     },

            ]
        }
        ]
    });

    $('.k-grid-filter').click(function () {
        $('.k-animation-container').addClass('k-rtl');
    });


});

kendo.culture(_culture);
//function getAlbumImages(AlbumId,rowIdx)
//{
//    $("#AlbumDetailsList").html("");
//    $.ajax({
//        url: "/Album/AlbumImages" ,
//        type: 'Get',
//        data: { AlbumId },
//        dataType: "html",
//        contentType: 'application/html; charset=utf-8',
//        beforeSend: function () {
//            //$("#imgAjaxLoader").show();
//        },
//        success: function (result) {
//            $("#AlbumDetailsList").append(result);
//            $('#CaseAttachmentModals').modal('show');
//        },
//        error: function (xhr) {
//            //$("#imgAjaxLoader").hide();
//            toastr.error(xhr.statusText);
//        }
//    });
//}

function getAlbumDetails(AlbumId, rowIdx) {
    $("#AlbumDetailsList").html("");
    $.ajax({
        url: "/Album/AlbumDetails" + '/' + AlbumId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            $("#AlbumDetailsList").append(result);
            $('#AlbumDetailsModals').modal('show');
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}
function getAlbumImages(AlbumId, rowIdx) {
    $("#AlbumDetailsList").html("");
    $.ajax({
        url: "/Album/AlbumImages" + '/' + AlbumId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            //$("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#AlbumDetailsList").append(result);
            $('#ImagesModals').modal('show');
        },
        error: function (xhr) {
            //$("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}
// get data from Album Details View 

function onUploadAlbumImageEdit(e) {
    var myForm = $("#EditAlbumForm");
    if (!myForm.valid()) {
        $("#EditImageAlbum").data("kendoUpload").trigger("cancel");
        e.preventDefault();
        return;
    };
    var data = {};
    $("#EditAlbumForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    e.data = data;
}
function onSuccessUploadDataEdit() {
    toastr.success(SuccessfulProcess);
    $('#AlbumDetailsModals').modal('hide');
    $("#grid").data("kendoGrid").dataSource.read();
    $("#grid").data("kendoGrid").refresh();
}
function onSelectImage(e) {
    $("#btnSubmitEdit").hide();
}
function submitEditSlide() {

    var myForm = $("#EditAlbumForm");
    myForm.submit(function (e) {
        $.validator.unobtrusive.parse(myForm)
        e.preventDefault();
        if (!myForm.valid()) return;
        var url = "/Album/EditAlbum"
        var data = {};
        $("#EditAlbumForm").serializeArray().map(function (x) { data[x.name] = x.value; });

        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: url,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                $('#AlbumDetailsModals').modal('hide');
            },
            error: function (xhr) {
                toastr.error(xhr.statusText);
            }
        });
    });
    myForm.submit();
    $("#grid").data("kendoGrid").dataSource.read();
    $("#grid").data("kendoGrid").refresh();

}
function ConfirmDeleteSlide(id) {
    var url = MersalWebAPIBaseUrl + "api/Albums/DeleteAlbum?id=" + id
    $.ajax({
        type: "POST",
        contentType: "application/json",
        headers: getHeaders(),
        url: url,
        async: false,
        success: function (data) {
            toastr.success(SuccessfulProcess);
            $("#grid").data("kendoGrid").dataSource.read();
            $("#grid").data("kendoGrid").refresh();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}

function DeleteAlbum(id) {
    var CallBackFunction = function () { ConfirmDeleteSlide(id); };
    confirmMessageBootstrap(ConfirmDelete,sureDelete, 400, 250, CallBackFunction);
}

//function confirmMessageBootstrap(title, HTMLMessage, width, height, InjectedSuccessionFunction) {

//    $("#ConfirmationMassageHeader").html(title);
//    $("#ConfirmationMassageH3").html(HTMLMessage);
//    $('#cofirmationMessageModals').modal('show');
//    $("#btnsubmitConfirmationDialog").on("click", function () {
//        InjectedSuccessionFunction();
//        $('#cofirmationMessageModals').modal('hide');
//        location.reload();
//    });
//}