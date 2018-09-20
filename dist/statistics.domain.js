$(function () {
  //#region fields 
  let meterDataList = [];
  let currentMeterParameters = [];
  let currentSelectedParameters = [];
  let currentSelectedMeters = [];
  //#endregion

  esdpec.framework.core.getJsonResult('common/gettree', function (response) {
    if (response.IsSuccess) {
      meterDataList = _.map(response.Content, a => {
        a.icon = esdpec.framework.core.Config.AssertSite + a.icon;
        return a;
      });
      $('#metertree').jstree({
        "core": {
          "multiple": false,
          "themes": {
            "responsive": false
          },
          // so that create works
          "check_callback": true,
          'data': meterDataList
        },
        "types": {
          "default": {
            "icon": "fa fa-folder icon-state-warning icon-lg"
          },
          "file": {
            "icon": "fa fa-file icon-state-warning icon-lg"
          }
        },
        "plugins": ["types", "search", "crrm"]
      }).on('loaded.jstree', function (e, data) {
        let instance = data.instance;
        let target = instance.get_node(e.target.firstChild.firstChild.lastChild);
        instance.open_node(target);
      }).on("select_node.jstree", function (e, data) {
        var node = data.node;
        var nodeId = node.original.id;
        if (node.original.modeltype == 'area') {

        } else {
          esdpec.framework.core.getJsonResult('dataanalysis/getparasbymeterid?meterId=' + nodeId, function (response) {
            if (response.IsSuccess) {
              currentMeterParameters = response.Content;
              console.dir(currentMeterParameters);
            }
          });
        }
      });

      let searchTimeout = false;
      $('#searchbox').keyup(function () {
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
        searchTimeout = setTimeout(function () {
          let keyword = $('#searchbox').val();
          $('#metertree').jstree(true).search(keyword);
        }, 100);
      });
    }
  });

  $(document).on('click', function (e) {
    e.stopPropagation();
    if (!$('.parameter-overlay').hasClass('close')) {
      $('.parameter-overlay').addClass('close').hide(300);
      $('#onchooseparameter>i').removeClass('triangle-transform');
    }
  });

  let initChart = function () {
    let option = {
      title: {
        subtext: '单位：kWh'
      },
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: 5,
        right: 100,
        bottom: 20
      },
      legend: {
        data: ['蒸发量', '降水量']
      },
      toolbox: {
        show: false,
        right: 50,
        top: -10,
        feature: {
          mark: {
            show: true
          },
          dataView: {
            show: true,
            readOnly: false
          },
          magicType: {
            show: true,
            type: ['line', 'bar']
          },
          restore: {
            show: true
          },
          saveAsImage: {
            show: true
          }
        }
      },
      calculable: true,
      xAxis: [{
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
      }],
      yAxis: [{
        type: 'value',
        position: 'right'
      }],
      dataZoom: [{
        type: "inside"
      }],
      series: [{
          name: '蒸发量',
          type: 'bar',
          data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6, 20.0, 6.4, 3.3],
          markPoint: {
            data: [{
                type: 'max',
                name: '最大值'
              },
              {
                type: 'min',
                name: '最小值'
              }
            ]
          },
          markLine: {
            data: [{
              type: 'average',
              name: '平均值'
            }]
          }
        },
        {
          name: '降水量',
          type: 'bar',
          data: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 175.6, 182.2, 48.7, 18.8, 6.0, 2.3],
          markPoint: {
            data: [{
                name: '年最高',
                value: 182.2,
                xAxis: 7,
                yAxis: 183,
                symbolSize: 18
              },
              {
                name: '年最低',
                value: 2.3,
                xAxis: 11,
                yAxis: 3
              }
            ]
          },
          markLine: {
            data: [{
              type: 'average',
              name: '平均值'
            }]
          }
        }
      ]
    };
    var chart = echarts.init(document.getElementById('chart-instance'), e_macarons);
    chart.setOption(option, true);
  }

  $('#onShowMeterInfo').on('click', function (e) {
    e.stopPropagation();
    $('.meter-info-container').toggleClass('close');
    if ($('.meter-info-container').hasClass('close')) {
      $('.meter-info-container').hide(300);
      $('#onShowMeterInfo>span:first-of-type').html('展开表计详情<i class="icon iconfont icon-xiaotuziCduan_"></i>');
    } else {
      $('.meter-info-container').show(300);
      $('#onShowMeterInfo>span:first-of-type').html('收起表计详情<i class="icon iconfont icon-xiaotuziCduan_1"></i>');
    }
  });

  $('#onchooseparameter').on('click', function (e) {
    e.stopPropagation();
    $('.parameter-overlay').toggleClass('close');
    if ($('.parameter-overlay').hasClass('close')) {
      $('.parameter-overlay').hide(300);
      $('#onchooseparameter>i').removeClass('triangle-transform');
    } else {
      $('.parameter-overlay').show(300);
      $('#onchooseparameter>i').addClass('triangle-transform');
    }
  });

  $('.btn-grp .btn').on('click', function (e) {
    e.stopPropagation();
    const currentDom = e.currentTarget;
    $('.btn-grp .btn').removeClass('date-active');
    $(currentDom).addClass('date-active');
    //TODO
    switch ($(currentDom).attr('data-value')) {
      case 'd':
        $('#day').removeClass('hidden');
        $('#month').addClass('hidden');
        $('#year').addClass('hidden');
        break;
      case 'm':
        $('#day').addClass('hidden');
        $('#month').removeClass('hidden');
        $('#year').addClass('hidden');
        break;
      case 'y':
        $('#day').addClass('hidden');
        $('#month').addClass('hidden');
        $('#year').removeClass('hidden');
        break;
    }
  });

  $('.operate-grp i.icon').on('click', function (e) {
    e.stopPropagation();
    const currentDom = e.currentTarget;
    $('.operate-grp i.icon').removeClass('btn-active');
    $(currentDom).addClass('btn-active');
    console.log($(currentDom).attr('data-value'));
    //TODO

  });

  $('#onshowdata').on('click', function (e) {
    e.stopPropagation();
    $('#onshowdata').toggleClass('close');
    if ($('#onshowdata').hasClass('close')) {
      $('#onshowdata').html('展开数据<i class="icon iconfont icon-xiaotuziCduan_"></i>');
      $('.summary-container').addClass('collapse-height');
      $('.progress-container').hide();
    } else {
      $('#onshowdata').html('收起展示<i class="icon iconfont icon-xiaotuziCduan_1"></i>');
      $('.summary-container').removeClass('collapse-height');
      $('.progress-container').show();
    }
  });

  layui.use('laydate', function () {
    let laydate = layui.laydate;
    laydate.render({
      elem: '#daycontainer',
      range: '--',
      format: 'yyyy-MM-dd',
      type: 'date',
      value: new Date().format('yyyy-MM-dd') + ' -- ' + new Date().format('yyyy-MM-dd'),
      done: (value, date) => {
        $('#datevalue').val(value);
      }
    });
    laydate.render({
      elem: '#monthcontainer',
      range: '--',
      format: 'yyyy-MM',
      type: 'month',
      value: new Date().format('yyyy-MM') + ' -- ' + new Date().format('yyyy-MM'),
      done: (value, date) => {
        $('#datevalue').val(value);
      }
    });
    laydate.render({
      elem: '#yearcontainer',
      range: '--',
      format: 'yyyy',
      type: 'year',
      value: new Date().format('yyyy') + ' -- ' + new Date().format('yyyy'),
      done: (value, date) => {
        $('#datevalue').val(value);
      }
    });
  });

  initChart();
});