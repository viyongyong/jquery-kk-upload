
$.fn.extend({
  id: '',
  config: {},
  libs: {},
  uploader: null,
  createUploadLayer: function (options, images) {
    this.id = $(this).attr('id');
    this.config = $.extend(true, $.extend(true, {}, KUPLOAD_CONFIG), options);
    this.createHtml();
    this.imagesInit(images);
    if (!window._kes) window._kes = {};
    window._kes[this.id] = this;
    return this;
  },
  pushLibs: function (key) {
    // console.log(key);
    KUPLOAD_CONFIG.libs[key].init(this.id);
  },
  createHtml: function () {
    var html = '';
    html += '<div class="kk-upload-mage">';
    if (this.config.show.item_show === 'list') {
      html += '<div class="upload-list">';
      html += '<div class="upload-item click-upload-mage-browse" style="width: ' + this.config.show.list_width  + '; height: ' + this.config.show.list_height + ';">';
      html += '<img src="' + this.config.KUPLOAD_MAGE_PATH + 'images/action/upload-s.png" class="upload-icon" />';
      html += '</div>';
      html += '</div>';
    } else if (this.config.show.item_show === 'ico') {
      html += '<div class="upload-ico" style="width: ' + this.config.show.ico_width + ';">';
      html += '<div class="button-list">';
      html += '<button class="p-r button click-start-upload">上传文件</button>';
      html += '<button class="p-r button click-upload-mage-browse">选择文件</button>';
      html += '</div>';
      html += '<table class="upload-table">';
      html += '</table>';
      html += '</div>';
    }
    html += '</div>';
    $('#' + this.id).html(html);
    this.createUploadLib();
    this.binding();
  },
  imagesInit: function (images) {
    for (var idx in images) {
      var url = images[idx].url;
      var ico = this.getFileTypeKey(url);
      if (this.config.show.item_show === 'list' && (ico === 'png' || ico === 'jpg' || ico === 'jpeg' || ico === 'gif')) {
        this.addFile('init_' + idx, images[idx].name, url, false, url, false);
      } else {
        this.addFile('init_' + idx, images[idx].name, this.getFileTypeUrl(url), false, url, false);
      }
    }
  },
  createUploadLib: function () {
    var me = this;
    var html = '<div style="display: none;">';
    html += '<button id="kk-' + this.id + '-mage-browse">选择文件</button>';
    html += '<button id="kk-' + this.id + '-mage-start-upload">上传文件</button>';
    html += '</div>';
    $('#' + this.id).append(html);
    
    this.uploader = new plupload.Uploader({
      browse_button: 'kk-' + this.id + '-mage-browse', // 触发文件选择对话框的按钮，为那个元素id
      url: me.config.upload.post_type === 'oss' ? 'upload' : me.config.upload.url, // 服务器端的上传页面地址
      flash_swf_url: this.config.KUPLOAD_MAGE_PATH + 'plupload-2.1.2/js/Moxie.swf', // swf文件，当需要使用swf方式进行上传时需要配置该参数
      silverlight_xap_url: this.config.KUPLOAD_MAGE_PATH + 'plupload-2.1.2/js/Moxie.xap', // silverlight文件，当需要使用silverlight方式进行上传时需要配置该参数
      filters: {
        mime_types : [
          { title : this.config.upload.file_type, extensions : this.config.upload.extensions }
        ],
        max_file_size : this.config.max_file_size,
        prevent_duplicates : true // 不允许选取重复文件
      },
      init: {
        PostInit: function () {
          $('#' + me.id).find('#kk-' + me.id + '-mage-start-upload').click(function() {
            $('#' + me.id).find('.upload-item[preview="true"]').addClass('up-preview');
            if (me.config.upload.post_type === 'oss') {
              me.setUploadParam(null, true);
            } else {
              me.uploader.start();
            }
          });
        },
        FilesAdded: function (uploader, addFiles) {
          $.each(addFiles || [], function(i, file) {
            showUrl = me.getFileTypeUrl(file.name);
            me.addFile(file.id, file.name, showUrl, true, '', true);
            if (me.config.show.item_show == 'list') {
              if (file.type === 'image/png' || file.type === 'image/jpeg') {
                var preLoader = new mOxie.Image();
                preLoader.onload = function () {
                  var showUrl = preLoader.type == 'image/jpeg' ? preLoader.getAsDataURL('image/jpeg', 80) : preLoader.getAsDataURL();
                  preLoader.destroy();
                  preLoader = null;
                  me.resetFileShowUrl(file.id, showUrl);
                };
                preLoader.load(file.getSource());
              }
            }
          });
          if (me.config.upload.now_upload) {
            $('#' + me.id).find('#kk-' + me.id + '-mage-start-upload').click();
          }
        },
        UploadProgress: function (uploader, file) {
          me.resetFilePercent(file.id, file.percent);
        },
        FileUploaded: function(uploader, file, info) {
          if (info.status === 200) {
            if (me.config.upload.post_type === 'oss') {
              me.removeProgress(file.id);
              url = me.domainUrl + '/' + file.uri;
              me.resetFileInputValue(file.id, url);
              var ico = me.getFileTypeKey(url);
              if (ico === 'png' || ico === 'jpg' || ico === 'jpeg' || ico === 'gif') {
                me.resetFileShowUrl(file.id, url, false);
              }
            }
            if (me.config.upload.file_uploaded_callback) {
              setTimeout(function() {
                me.config.upload.file_uploaded_callback(url);
              }, 1);
            }
          }
        },
        UploadComplete: function (uploader, files) {
          var urls = [];
          for (var idx in files) {
            urls.push(me.domainUrl + '/' + files[idx].uri);
          }
          if (me.config.upload.upload_complete_callback) {
            setTimeout(function() {
              me.config.upload.upload_complete_callback(urls);
            }, 1);
          }
          for (var idx in files) {
            me.removeUploadFile(files[idx].id);
          }
        }
      }
    });
    this.uploader.init();
  },
  setUploadParam: function (file, bool) {
    var me = this;
    if (bool) {
      $.ajax({
        url: me.config.upload.authorization,
        type: 'POST',
        dataType: 'json',
        timeout: 30000,
        async: false,
        success: function (response) {
          if (response.state == 1) {
            me.newMultipartDir = response.data.dir;
            me.newMultipartParams = {};
            me.newMultipartParams['policy'] = response.data.policy;
            me.newMultipartParams['OSSAccessKeyId'] = response.data.accessid;
            me.newMultipartParams['success_action_status'] = '200';
            me.newMultipartParams['signature'] = response.data.signature;
            me.domainUrl = response.data.domain_url;
            for (var idx in me.uploader.files) {
              me.setUploadParam(me.uploader.files[idx], false);
            }
          } else {
            alert(response.message);
            me.uploader.files.splice(0, uploader.files.length);
            me.uploader.stop();
          }
        }
      });
    } else {
      if (file) {
        file['uri'] = me.newMultipartDir + '/' + me.randomString(20) + '.' + me.getFileTypeKey(file.name);
        me.newMultipartParams['key'] = file['uri'];
        me.uploader.setOption({
          'url': me.domainUrl,
          'multipart_params': me.newMultipartParams
        });
        me.uploader.start();
      }
    }
  },
  randomString: function (len) {
    len = len || 32;
    var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    var maxPos = $chars.length;
    var ret = '';
    var time = new Date().getTime().toString();
    if (len / 2 > time.length) {
      len = len - time.length;
    } else {
      len = len / 2;
    }
    for (var i = 0; i < len; i++) {
      ret += $chars.charAt(Math.floor(Math.random() * maxPos));
      if (time[i]) {
        ret += time[time.length - i - 1];
      }
    }
    return ret;
  },
  removeUploadFile: function (id) {
    this.uploader.removeFile(id);
  },
  getFileTypeUrl: function (fileName) {
    return this.config.KUPLOAD_MAGE_PATH + 'images/types/' + this.getFileTypeKey(fileName) + '.svg';
  },
  getFileTypeKey: function (fileName) {
    if (fileName) {
      return fileName.substring(fileName.lastIndexOf(".") + 1, fileName.length);
    }
    return '';
  },
  getFileInputName: function () {
    var fileInpue = this.config.file_input;
    if (fileInpue === '') return '';
    fileInpue = fileInpue.replace(/\'/g,"&#39;");
    fileInpue = fileInpue.replace(/\"/g,"&quot;");
    if (this.config.num_max > 1) {
      fileInpue += '[]';
    }
    return fileInpue;
  },
  getFileNum: function () {
    return $('#' + this.id).find('.upload-item').length - 1;
  },
  getFiles: function () {
    var me = this;
    var ret = [];
    $('#' + this.id).find('.upload-item').each(function() {
      if ($(this).attr('key')) {
        var item = {};
        item['id'] = $(this).attr('key');
        item['show'] = $(this).find('.show-image').attr('src');
        if (me.getFileInputName()) {
          item['value'] = $(this).find('.show-input').val();
        }
        ret.push(item);
      }
    });
    return ret;
  },
  resetFilePercent: function (id, percent) {
    var item = $('#' + this.id).find('.upload-item[key="' + id +'"]');
    if (this.config.show.item_show === 'list') {
      item.find('.progress-bar').animate({'width': percent + '%'}, 50);
    } else if (this.config.show.item_show === 'ico') {
      item.find('.progress').html(percent + '%');
    }
  },
  removeProgress: function (id) {
    $('#' + this.id).find('.upload-item[key="' + id +'"]').removeAttr('preview');
    $('#' + this.id).find('.upload-item[key="' + id +'"]').removeClass('up-preview');
  },
  resetFileInputValue: function (id, value) {
    console.log(value);
    var item = $('#' + this.id).find('.upload-item[key="' + id +'"]');
    item.find('.show-input').val(value);
  },
  resetFileShowUrl: function (id, showUrl, ioc) {
    var item = $('#' + this.id).find('.upload-item[key="' + id +'"]');
    item.find('.show-image').attr('src', showUrl);
    if (ioc) {
      item.find('.show-image').css({'margin-top': '20%', 'width': '35%'});
    } else {
      item.find('.show-text').remove();
      item.find('.show-image').css({'margin-top': '0', 'width': 'unset'});
    }
  },
  addFile: function (id, fileName, showUrl, ioc, fileValue, preview) {
    if (this.getFileNum() >= this.config.upload.num_max) {
      this.removeUploadFile(id);
      return false;
    }

    var html = '';
    if (this.config.show.item_show === 'list') {
      html += '<div class="upload-item" ' + (preview ? 'preview="true"' : '') + ' key="' + id + '" style="width: ' + this.config.show.list_width + '; height: ' + this.config.show.list_height + ';">';
      if (ioc) {
        html += '<img src="' + showUrl + '" style="margin-top: 20%; width: 35%;" class="show-image" />';
        html += '<p class="show-text" style="margin-top: 5px;">' + fileName + '</p>';
      } else {
        html += '<img src="' + showUrl + '" draggable="false" class="show-image" />';
      }
      if (this.getFileInputName()) {
        html += '<input name="' + this.getFileInputName() + '" value="' + fileValue + '" type="hidden" class="show-input" />'
      }
      html += '<div class="upload-uploading">';
      html += '<div class="progress-bar"></div>';
      html += '<div class="box"></div>';
      html += '</div>';

      html += '<div class="upload-list-cover">';
      if (this.config.show.is_sort) {
        html += '<img src="' + this.config.KUPLOAD_MAGE_PATH + 'images/action/left.png" class="do-icon left-icon" />';
        html += '<img src="' + this.config.KUPLOAD_MAGE_PATH + 'images/action/right.png" class="do-icon right-icon" />';
      }
      html += '<img src="' + this.config.KUPLOAD_MAGE_PATH + 'images/action/delete.png" class="do-icon delete-icon" />';
      html += '</div>';
      html += '</div>';

      $('#' + this.id).find('.click-upload-mage-browse').before(html);
    } else if (this.config.show.item_show === 'ico') {
      html += '<tr class="upload-item" ' + (preview ? 'preview="true"' : '') + ' key="' + id + '">';
      html += '<td>';
      html += '<img src="' + showUrl + '" style="width: 32px;" />';
      html += '</td>';
      html += '<td>';
      html += '<span>' + fileName + '</span>';
      if (this.getFileInputName()) {
        html += '<input name="' + this.getFileInputName() + '" value="' + fileValue + '" type="hidden" class="show-input" />'
      }
      html += '</td>';
      html += '<td style="width: 50px" class="progress">';
      if (preview) {
        html += '等待上传';
      } else {
        html += '100%';
      }
      html += '</td>';
      html += '<td style="width: 40px;">';
      html += '<img src="' + this.config.KUPLOAD_MAGE_PATH + 'images/action/delete.png" class="do-icon delete-icon p-r" />';
      html += '</td>';
      html += '</tr>';

      $('#' + this.id).find('.upload-table').append(html);
    }
    if (this.getFileNum() >= this.config.upload.num_max) {
      $('#' + this.id).find('.click-upload-mage-browse').hide();
    }
  },
  moveLeftImage: function (icon) {
    if ($(icon).parent().parent().prev().length !== 0) {
      $(icon).parent().parent().prev().before($(icon).parent().parent());
    }
  },
  moveRightImage: function (icon) {
    if ($(icon).parent().parent().next().length !== 0 && !$(icon).parent().parent().next().hasClass('click-upload-mage-browse')) {
      $(icon).parent().parent().next().after($(icon).parent().parent());
    }
  },
  deleteImage: function (icon) {
    this.removeUploadFile($(icon).parent().parent().attr('key'));
    $(icon).parent().parent().remove();
    if (this.getFileNum() < this.config.upload.num_max) {
      $('#' + this.id).find('.click-upload-mage-browse').show();
    }
  },
  binding: function () {
    var me = this;
    $('#' + this.id).find('.click-upload-mage-browse').click(function() {
      $('#kk-' + me.id + '-mage-browse').click();
    });
    $('#' + this.id).find('.click-start-upload').click(function() {
      console.log('#kk-' + me.id + '-mage-start-upload');
      $('#kk-' + me.id + '-mage-start-upload').click();
    });

    $('#' + this.id + ' .left-icon').live('click', function() { me.moveLeftImage(this); });
    $('#' + this.id + ' .right-icon').live('click', function() { me.moveRightImage(this); });
    $('#' + this.id + ' .delete-icon').live('click', function() { me.deleteImage(this); });
  }
});
