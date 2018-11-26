(function () {
  window.KUPLOAD_CONFIG  = {
    KUPLOAD_MAGE_PATH: '/jquery-kk-upload/',
    KUPLOAD_MAGE_VERSION: '0.1.0',
    libs: {},
    upload: {
      now_upload: true,
      num_max: 10,    // 上传数量
      post_type: 'oss',   // now => url, oss => authorization
      file_type: 'image', // image, file
      extensions: 'jpg,jpeg,gif,png,bmp', // 上传文件扩展
      url: '',
      authorization: '',
      file_uploaded_callback: null,
      upload_complete_callback: null
    },
    show: {
      item_show: 'list',     // ico: 文件图标列出来, list： 图片样式列出来
      list_width: '150px',
      list_height: '150px',
      ico_width: '450px',
      is_sort: true
    },
    file_input: '',
    max_file_size: '10mb'
  };
})();
