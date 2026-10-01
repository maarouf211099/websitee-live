/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function (config) {
    // Define changes to default configuration here. For example:
    if (_cultureIsArabic) {
        config.language = 'ar';
    }
    else {
        config.language = 'en'; 
    }
    //config.uiColor = '#00C0EF';
    config.filebrowserUploadUrl = '/DynamicPage/uploadImage';
    config.filebrowserBrowseUrl = "/DynamicPage/uploadedImageURL";
};
