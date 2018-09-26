$(function () {
  //#region fields 
  let analysisChart = null;
  let meterDataList = [];
  let searchResult = {};
  let currentSelectedNode = null;
  let currentMeterParameters = [];
  let comparsionSelectedMeters = [];
  let currentAreaModules = [];
  //#endregion
  let getMeterStatus = function (state) {
    switch (state) {
      case 0:
        return '正常';
      case 1:
        return '关电闸';
      case 2:
        return '报警中';
      case 3:
        return '屏蔽直到某个时间点开启'
    }
  };
  let getMeterBelongArea = function (meterId) {
    let nodeInfo = _.find(meterDataList, a => a.id === meterId);
    if (!nodeInfo) return '';
    if (nodeInfo.parent === '#') return nodeInfo.text;
    let parent = _.find(meterDataList, a => a.id === nodeInfo.parent);
    return getMeterBelongArea(parent.id) + (nodeInfo.modeltype === 'area' ? " > " + nodeInfo.text : '');
  };
  let getSearchDateType = function () {
    let chooseDom = _.head($('.btn-grp>div.date-active'));
    if (chooseDom) return parseInt($(chooseDom).attr('data-value'));
    return -1;
  };
  let getWeek = () => {
    let weekOfday = parseInt(moment().format('E'));
    let last_monday = moment().subtract(weekOfday - 1, 'days').format('YYYY-MM-DD 00:00:00');
    let last_sunday = moment().add(7 - weekOfday, 'days').format('YYYY-MM-DD 23:59:59');
    return {
      monday: last_monday,
      sunday: last_sunday
    };
  };
  let resetSTimeAndETime = function (type) {
    switch (type) {
      case 2:
        return new Date().format('yyyy-MM-dd') + ' 00:00:00 -- ' + new Date().format('yyyy-MM-dd') + ' 23:59:59';
      case 3:
        return getWeek().monday + ' -- ' + getWeek().sunday;
      case 4:
        let daysInMonth = new moment(new Date()).daysInMonth();
        return new Date().format('yyyy-MM-') + '01 -- ' + new Date().format('yyyy-MM-') + daysInMonth;
      case 5:
        return new Date().format('yyyy-') + '01-01 -- ' + new Date().format('yyyy-') + '12-31';
    }
  };
  let getDefaultSTimeAndETime = function (type) {
    let stimeAndetime = $('#datevalue').val();
    if (stimeAndetime === '') {
      return resetSTimeAndETime(type);
    }
    return stimeAndetime;
  };
  let getChartType = function () {
    let activeItem = $('.operate-grp>.should-uniq.btn-active')
    if (!activeItem) return 'bar';
    return $(activeItem).attr('data-value');
  };
  let getXAxisData = function (type, sTime, eTime) {
    switch (type) {
      case 2:
        let dayxAxis = [];
        let startTime = new moment(_.trim(sTime));
        let endTime = new moment(_.trim(eTime));
        for (let i = startTime; i <= endTime; i = i.add(1, 'h')) {
          dayxAxis.push(i.format('YYYY-MM-DD HH'));
        }
        return dayxAxis;
      case 3:
      case 4:
        let monthxAxis = [];
        let monthStartTime = new moment(_.trim(sTime));
        let monthEndTime = new moment(_.trim(eTime));
        for (let i = monthStartTime; i <= monthEndTime; i = i.add(1, 'd')) {
          monthxAxis.push(i.format('YYYY-MM-DD'));
        }
        return monthxAxis;
      case 5:
        let yearxAxis = [];
        let ssTime = new moment(sTime);
        let eeTime = new moment(eTime);
        for (let i = ssTime; i <= eeTime; i = i.add(1, 'month')) {
          yearxAxis.push(i.format('YYYY-MM'));
        }
        return yearxAxis;
    }
  };
  let getOriginalXAxisData = function (datas) {
    let xDatas = [];
    _.each(datas, data => {
      _.each(data.now_data_list, now => {
        xDatas.push(now.date);
      });
    });
    return _.sortedUniq(xDatas);
  };
  let getChartSeries = function (datas, mfIdAndNameMap, xAxisData, type = 'bar', showLabel = false) {
    let seriesArray = [];
    _.each(datas, data => {
      let series = {
        name: _.find(mfIdAndNameMap, a => a.id === data.mfid).name,
        type: type
      };
      series.itemStyle = {
        normal: {
          label: {
            show: showLabel,
          }
        }
      };
      series.data = _.map(xAxisData, a => {
        var valueItem = _.find(data.now_data_list, b => b.date === a);
        if (!!valueItem) return valueItem.val;
      });
      series.markPoint = {
        data: [{
            type: 'max',
            name: '最大值'
          },
          {
            type: 'min',
            name: '最小值'
          }
        ]
      };
      series.markLine = {
        data: [{
          type: 'average',
          name: '平均值',
          tooltip: {
            trigger: 'item',
            formatter: function (params) {
              return params.seriesName + "<br/>" + params.data.name + ": " + params.data.value;
            }
          }
        }]
      };
      let rule = data.rule;
      if (rule != null) {
        if (rule.LowerLimit != null) {
          series.markLine.data.push({
            name: 'LowerLimit',
            itemStyle: {
              normal: {
                color: '#dc143c'
              }
            },
            label: {
              formatter: '下限报警(' + rule.LowerLimit + ')',
              textStyle: {
                fontSize: 12,
                color: '#dc143c'
              },
              position: 'middle'
            },
            yAxis: rule.LowerLimit
          });
          if (rule.LowerWave != null) {
            let waveValue = rule.LowerLimit + rule.LowerWave;
            series.markLine.data.push({
              name: 'LowerWave',
              itemStyle: {
                normal: {
                  color: '#FF8C00'
                }
              },
              label: {
                formatter: getPlaceHolder() + '下限预警(' + waveValue + ')',
                textStyle: {
                  fontSize: 12,
                  color: '#FF8C00',
                  marginRight: '2rem'
                },
                position: 'middle'
              },
              yAxis: waveValue
            });
          }
        }
        if (rule.UpperLimit != null) {
          series.markLine.data.push({
            name: 'UpperLimit',
            itemStyle: {
              normal: {
                color: '#dc143c'
              }
            },
            label: {
              formatter: '上限报警(' + rule.UpperLimit + ')',
              textStyle: {
                fontSize: 12,
                color: '#dc143c'
              },
              position: 'middle'
            },
            yAxis: rule.UpperLimit
          });
          if (rule.UpperWave != null) {
            let waveValue = rule.UpperLimit - rule.UpperWave;
            series.markLine.data.push({
              name: 'LowerWave',
              itemStyle: {
                normal: {
                  color: '#FF8C00'
                }
              },
              label: {
                formatter: getPlaceHolder() + '上限预警(' + waveValue + ')',
                textStyle: {
                  fontSize: 12,
                  color: '#FF8C00'
                },
                position: 'middle'
              },
              yAxis: waveValue
            });
          }
        }
      }
      seriesArray.push(series);
    });
    return seriesArray;
  };
  let getChartSeriesForCost = function (datas, mfIdAndNameMap, xAxisData, showLabel = false) {
    let seriesArray = [];
    _.each(datas, data => {
      let series = {
        name: _.find(mfIdAndNameMap, a => a.id === data.mfid).name + '_费用',
        type: 'line'
      };
      series.data = _.map(xAxisData, a => {
        var valueItem = _.find(data.now_data_list, b => b.date === a);
        if (!!valueItem) return valueItem.cost;
      });
      series.itemStyle = {
        normal: {
          borderWidth: 1,
          lineStyle: {
            type: 'solid',
            color: 'rgb(194,53,49)',
            width: 2,
          },
          label: {
            show: showLabel
          }
        },
      };
      series.markPoint = {
        data: [{
            type: 'max',
            name: '最大值'
          },
          {
            type: 'min',
            name: '最小值'
          }
        ]
      };
      series.markLine = {
        data: [{
          type: 'average',
          name: '平均值',
          tooltip: {
            trigger: 'item',
            formatter: function (params) {
              return params.seriesName + "<br/>" + params.data.name + ": " + params.data.value;
            }
          }
        }]
      };
      seriesArray.push(series);
    });
    return seriesArray;
  }
  let searchMeterData = function () {
    //comparsion
    if (comparsionSelectedMeters.length > 0) {

    } else {
      if (currentMeterParameters.length <= 0) {
        toastr.warning('请先选择查询仪表');
        return;
      }
      let currentSelectedParameters = _.filter(currentMeterParameters, a => a.isChecked);
      if (currentSelectedParameters.length <= 0) return;
      let parameter = _.head(currentSelectedParameters);
      let mfids = _.map(currentSelectedParameters, a => a.id);
      let dateType = getSearchDateType();
      let searchDateType = dateType === -1 ? 2 : dateType;
      let searchParaType = dateType === -1 ? 1 : parameter.type;
      let defaultTimeStr = getDefaultSTimeAndETime(searchDateType);
      let sTime = defaultTimeStr.split('--')[0];
      let eTime = defaultTimeStr.split('--')[1];
      let uriparam = `mfids=${_.join(mfids, ',')}&paraType=${searchParaType}&dateType=${searchDateType}&sTime=${sTime}&eTime=${eTime}`;
      esdpec.framework.core.getJsonResult('dataanalysis/getdata?' + uriparam, function (response) {
        if (response.IsSuccess) {
          let chartLegend = [];
          let chartXaxisData = [];
          let checkedParameters = _.filter(currentMeterParameters, p => _.includes(mfids, p.id));
          chartLegend = _.map(checkedParameters, a => a.name);
          chartXaxisData = searchParaType === 0 ? getXAxisData(dateType, sTime, eTime) : getOriginalXAxisData(response.Content.data_list);
          let datas = searchParaType === 0 ? [response.Content] : response.Content.data_list;
          searchResult = {
            unit: parameter.unit,
            chartLegend,
            chartXaxisData,
            datas,
            checkedParameters
          };
          assembleChartComponent(parameter.unit, chartLegend, chartXaxisData, datas, checkedParameters, getChartType());
          if (currentSelectedNode.modeltype === 'meter') {
            $('#summary-container').show();
            $('.func-tab').show();
            if (searchParaType === 0 && dateType === 2) {
              $('.summary-container').show();
              generateContemporaryComparison(response.Content.avg_per, response.Content.avg_val, response.Content.last_sum_val, response.Content.now_sum_val, response.Content.sum_per, parameter.unit);
            } else if (searchParaType !== 0) $('.summary-container').hide();
            generateGraphData(parameter.unit, searchParaType);
            generateOriginalData();
            generatePeakData();
          } else {
            $('#summary-container').hide();
            $('.func-tab').hide();
          }
        }
      });
    }
  };
  let assembleChartComponent = function (unit, chartLegend, chartXaxisData, datas, checkedParameters, chartType = 'bar') {
    let chartSeries = getChartSeries(datas, _.map(checkedParameters, a => {
      return {
        id: a.id,
        name: a.name
      };
    }), chartXaxisData, chartType);
    generateChart(unit, chartLegend, chartXaxisData, chartSeries);
  };
  let generateChart = function (unit, chartLegend, chartXaxisData, chartSeries) {
    let option = {
      title: {
        subtext: '单位：' + unit
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
        data: chartLegend
      },
      calculable: true,
      xAxis: [{
        type: 'category',
        data: chartXaxisData
      }],
      yAxis: [{
        type: 'value',
        position: 'right'
      }],
      dataZoom: [{
        type: "inside"
      }],
      series: chartSeries
    };
    analysisChart = echarts.init(document.getElementById('chart-instance'), e_macarons);
    analysisChart.setOption(option, true);
    window.onresize = analysisChart.resize;
  }
  let generateContemporaryComparison = function (avg_per, avg_val, last_sum_val, now_sum_val, sum_per, unit) {
    let maxVal = _.max([last_sum_val, now_sum_val, avg_val]);
    let data = {
      data: {
        unit,
        avg_per: avg_per.toFixed(2),
        sum_per: sum_per.toFixed(2),
        avg_val: avg_val.toFixed(2),
        last_sum_val: last_sum_val.toFixed(2),
        now_sum_val: now_sum_val.toFixed(2),
        last_sum_width: maxVal === last_sum_val ? '98%' : ((last_sum_val / maxVal) * 100) + '%',
        now_sum_width: maxVal === now_sum_val ? '98%' : ((now_sum_val / maxVal) * 100) + '%',
        avg_val_width: maxVal === avg_val ? '98%' : ((avg_val / maxVal) * 100) + '%'
      }
    };
    let templateHtml = template('contemporary-Comparison-template', data);
    $('#summary-container').html(templateHtml);
    setTimeout(() => {
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
      if ($('#now_sum_val').parent().parent().width() <= 130) {
        $('#now_sum_val').css('left', '0');
      } else {
        $('#now_sum_val').css('transform', 'translateX(-100%)');
      }
      if ($('#last_sum_val').parent().parent().width() <= 130) {
        $('#last_sum_val').css('left', '0');
      } else {
        $('#last_sum_val').css('transform', 'translateX(-100%)');
      }
      if ($('#avg_val').parent().parent().width() <= 130) {
        $('#avg_val').css('left', '0');
      } else {
        $('#avg_val').css('transform', 'translateX(-100%)');
      }
    }, 100);
  };
  let generateGraphData = function (unit, type) {
    let currentSelectedParameters = _.filter(currentMeterParameters, a => a.isChecked);
    if (currentSelectedParameters.length <= 0) return;
    let data = {
      selectedParameterList: currentSelectedParameters
    };
    let head = _.head(data.selectedParameterList);
    head.isDefault = true;
    let templateHtml = template('list-body-template', data);
    $('#list-body').html(templateHtml);
    setTimeout(() => {
      $('.list-body>div.choose-param-item').on('click', function (e) {
        e.stopPropagation();
        let currentDom = e.currentTarget;
        $('.list-body>div.choose-param-item').removeClass('param-item-active');
        $(currentDom).addClass('param-item-active');
        let mfid = $(currentDom).attr('data-id');
        let originalList = _.find(searchResult.datas, item => item.mfid === mfid);
        let originalDatas = {
          data: {
            unit,
            type,
            graphDataList: originalList ? originalList.now_data_list || [] : []
          }
        }
        let originalDataHtml = template('graph-table-template', originalDatas);
        $('#graph-table').html(originalDataHtml);
      });
    }, 100);
    let originalList = _.find(searchResult.datas, item => item.mfid === head.id);
    let originalDatas = {
      data: {
        unit,
        type,
        graphDataList: originalList ? originalList.now_data_list || [] : []
      }
    }
    let originalDataHtml = template('graph-table-template', originalDatas);
    $('#graph-table').html(originalDataHtml);
  };
  let generateOriginalData = function () {
    let nodeId = currentSelectedNode.id;
    esdpec.framework.core.getJsonResult('dataanalysis/getparasbymeterid?meterId=' + nodeId, function (response) {
      if (response.IsSuccess) {
        console.dir(response.Content);
      }
    });
  };
  let generatePeakData = function () {

  };
  let areaWindowInteractive = function () {
    $('#area-zone').show();
    $('#meter-zone').hide();
    $('.func-tab').hide();
    $('#onshowmeterinfo').hide();
    $('.content-footer').hide();
    $('.module-container').show();
  };
  let meterWindowInteractive = function () {
    $('#area-zone').hide();
    $('#meter-zone').show();
    $('.func-tab').show();
    $('#onshowmeterinfo').show();
    $('.content-footer').show();
    $('.module-container').hide();
  };
  $('#onshowmeterinfo').on('click', function (e) {
    e.stopPropagation();
    $('.meter-info-container').toggleClass('close');
    if ($('.meter-info-container').hasClass('close')) {
      $('.meter-info-container').hide(300);
      $('#onshowmeterinfo>span:first-of-type').html('展开表计详情<i class="icon iconfont icon-xiaotuziCduan_"></i>');
    } else {
      $('.meter-info-container').show(300);
      $('#onshowmeterinfo>span:first-of-type').html('收起表计详情<i class="icon iconfont icon-xiaotuziCduan_1"></i>');
    }
  });

  $('#onshowmoreparameter').on('click', function (e) {
    e.stopPropagation();
    //$('.parameter-overlay').toggleClass('close');
    $('#onshowmoreparameter').toggleClass('close');
    if ($('#onshowmoreparameter').hasClass('close')) {
      //$('.parameter-overlay').hide(300);
      //$('#onshowmoreparameter>i').removeClass('triangle-transform');
      $('#onshowmoreparameter').html('更多参数<i class="icon iconfont icon-xiaotuziCduan_"></i>');
      let parameters = {
        parameterList: _.slice(currentMeterParameters, 0, 5)
      };
      let templateHtml = template('parameter-list-template', parameters);
      $('.parameter-right').html(templateHtml);
    } else {
      //$('.parameter-overlay').show(300);
      //$('#onshowmoreparameter>i').addClass('triangle-transform');
      $('#onshowmoreparameter').html('隐藏更多<i class="icon iconfont icon-xiaotuziCduan_1"></i>');
      let parameters = {
        parameterList: currentMeterParameters
      };
      let templateHtml = template('parameter-list-template', parameters);
      $('.parameter-right').html(templateHtml);
    }
  });

  $('.btn-grp .btn').on('click', function (e) {
    e.stopPropagation();
    const currentDom = e.currentTarget;
    _.each($('.btn-grp .btn'), item => {
      if ($(item).attr('data-value') !== $(currentDom).attr('data-value')) {
        $(item).removeClass('date-active');
      }
    });
    $(currentDom).toggleClass('date-active');
    if ($(currentDom).hasClass('date-active')) {
      switch ($(currentDom).attr('data-value')) {
        case '2':
          $('.date-grp').show();
          $('#day').removeClass('hidden');
          $('#month').addClass('hidden');
          $('#year').addClass('hidden');
          break;
        case '3':
          $('.date-grp').hide();
          break;
        case '4':
          $('.date-grp').show();
          $('#day').addClass('hidden');
          $('#month').removeClass('hidden');
          $('#year').addClass('hidden');
          break;
        case '5':
          $('.date-grp').show();
          $('#day').addClass('hidden');
          $('#month').addClass('hidden');
          $('#year').removeClass('hidden');
          break;
      }
      $('#datevalue').val(resetSTimeAndETime(parseInt($(currentDom).attr('data-value'))));
    } else {
      $('.date-grp').show();
      $('#day').removeClass('hidden');
      $('#month').addClass('hidden');
      $('#year').addClass('hidden');
      $('#datevalue').val(resetSTimeAndETime(2));
      $('#daycontainer').val(new Date().format('yyyy-MM-dd') + ' -- ' + new Date().format('yyyy-MM-dd'));
    }
    searchMeterData();
  });

  $('.operate-grp i.icon').on('click', function (e) {
    e.stopPropagation();
    const currentDom = e.currentTarget;
    if ($(currentDom).hasClass('should-uniq')) {
      $('.operate-grp i.should-uniq').removeClass('btn-active');
      $(currentDom).addClass('btn-active');
    } else {
      $(currentDom).toggleClass('btn-active');
    }
    //TODO
    let chartSeries = [];
    switch ($(currentDom).attr('data-value')) {
      //#region rmb
      case 'rmb':
        chartSeries = getChartSeries(searchResult.datas, _.map(searchResult.checkedParameters, a => {
          return {
            id: a.id,
            name: a.name
          };
        }), searchResult.chartXaxisData, getChartType(), $('.show-tip').hasClass('btn-active') ? true : false);
        if ($(currentDom).hasClass('btn-active')) {
          let costSeries = getChartSeriesForCost(searchResult.datas, _.map(searchResult.checkedParameters, a => {
            return {
              id: a.id,
              name: a.name
            };
          }), searchResult.chartXaxisData, $('.show-tip').hasClass('btn-active') ? true : false);
          chartSeries = _.concat(chartSeries, costSeries);
        }
        break;
        //#endregion
        //#region bar
      case 'bar':
        chartSeries = getChartSeries(searchResult.datas, _.map(searchResult.checkedParameters, a => {
          return {
            id: a.id,
            name: a.name
          };
        }), searchResult.chartXaxisData, 'bar', $('.show-tip').hasClass('btn-active') ? true : false);
        if ($('.icon-RMB').hasClass('btn-active')) {
          let costSeries = getChartSeriesForCost(searchResult.datas, _.map(searchResult.checkedParameters, a => {
            return {
              id: a.id,
              name: a.name
            };
          }), searchResult.chartXaxisData, $('.show-tip').hasClass('btn-active') ? true : false);
          chartSeries = _.concat(chartSeries, costSeries);
        }
        break;
        //#endregion
        //#region line
      case 'line':
        chartSeries = getChartSeries(searchResult.datas, _.map(searchResult.checkedParameters, a => {
          return {
            id: a.id,
            name: a.name
          };
        }), searchResult.chartXaxisData, 'line', $('.show-tip').hasClass('btn-active') ? true : false);
        if ($('.icon-RMB').hasClass('btn-active')) {
          let costSeries = getChartSeriesForCost(searchResult.datas, _.map(searchResult.checkedParameters, a => {
            return {
              id: a.id,
              name: a.name
            };
          }), searchResult.chartXaxisData, $('.show-tip').hasClass('btn-active') ? true : false);
          chartSeries = _.concat(chartSeries, costSeries);
        }
        break;
        //#endregion
      case 'pie':

        return;
      case 'download':

        return;
        //#region tip
      case 'tip':
        chartSeries = getChartSeries(searchResult.datas, _.map(searchResult.checkedParameters, a => {
          return {
            id: a.id,
            name: a.name
          };
        }), searchResult.chartXaxisData, getChartType(), $(currentDom).hasClass('btn-active') ? true : false);
        if ($('.icon-RMB').hasClass('btn-active')) {
          let costSeries = getChartSeriesForCost(searchResult.datas, _.map(searchResult.checkedParameters, a => {
            return {
              id: a.id,
              name: a.name
            };
          }), searchResult.chartXaxisData, $(currentDom).hasClass('btn-active') ? true : false);
          chartSeries = _.concat(chartSeries, costSeries);
        }
        break;
        //#endregion
    }
    generateChart(searchResult.unit, searchResult.chartLegend, searchResult.chartXaxisData, chartSeries);
  });

  $('.layui-tab-title>li').on('click', function (e) {
    e.stopPropagation();
    let currentDom = e.currentTarget;
    $('.layui-tab-title>li').removeClass("layui-this");
    $('.layui-tab-content>div').hide();
    $(currentDom).addClass('layui-this');
    $('#' + $(currentDom).attr('data-id')).show();
  })

  $('#area-zone .operate-hander').on('click', function (e) {
    e.stopPropagation();
    $('#dialog_content').dialogModal({
      onOkBut: function () {},
      onCancelBut: function () {},
      onLoad: function () {},
      onClose: function () {},
    });
  });

  $('.content__header--btngrp .module-container').on('click', function (e) {
    e.stopPropagation();
    $('#dialog_content').dialogModal({
      onOkBut: function () {},
      onCancelBut: function () {},
      onLoad: function () {},
      onClose: function () {},
    });
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
        let truthValue = value.split('--');
        $('#datevalue').val(_.trim(truthValue[0]) + ' 00:00:00 -- ' + truthValue[1] + ' 23:59:59');
        searchMeterData();
      }
    });
    laydate.render({
      elem: '#monthcontainer',
      range: '--',
      format: 'yyyy-MM',
      type: 'month',
      value: new Date().format('yyyy-MM') + ' -- ' + new Date().format('yyyy-MM'),
      done: (value, date) => {
        let truthValue = value.split('--');
        let dayInMonth = new moment(truthValue[1]).daysInMonth();
        $('#datevalue').val(_.trim(truthValue[0]) + '-01 -- ' + truthValue[1] + '-' + dayInMonth);
        searchMeterData();
      }
    });
    laydate.render({
      elem: '#yearcontainer',
      range: '--',
      format: 'yyyy',
      type: 'year',
      value: new Date().format('yyyy') + ' -- ' + new Date().format('yyyy'),
      done: (value, date) => {
        let truthValue = value.split('--');
        $('#datevalue').val(_.trim(truthValue[0]) + '-01-01 -- ' + truthValue[1] + '-12-31');
        searchMeterData();
      }
    });
  });

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
        instance.select_node(target);
      }).on("select_node.jstree", function (e, data) {
        let node = data.node;
        let nodeId = node.original.id;
        currentSelectedNode = node.original;
        $('.meterName').text(node.original.text);
        $('.content__header--title').text(node.original.text + ' - 仪表数据详情');
        if (node.original.modeltype == 'area') {
          currentMeterParameters = [];
          areaWindowInteractive();
          // esdpec.framework.core.getJsonResult('dataanalysis/getparasbymeterid', function (response) {
          //   if (response.IsSuccess) {
          //     currentAreaModules = [];
          //     if (currentAreaModules.length <= 0) {

          //       return;
          //     }
          //   }
          // });
        } else {
          meterWindowInteractive();
          esdpec.framework.core.getJsonResult('dataanalysis/getparasbymeterid?meterId=' + nodeId, function (response) {
            if (response.IsSuccess) {
              currentMeterParameters = response.Content;
              let firstAggreate = _.find(currentMeterParameters, a => a.type === 0);
              firstAggreate.isChecked = true;
              if (currentMeterParameters.length > 6) {
                $('#onshowmoreparameter').removeClass('hidden');
              } else $('#onshowmoreparameter').addClass('hidden');
              _.each(currentMeterParameters, a => {
                if (a.name.length > 8)
                  a.displayName = a.name.substring(0, 3) + '...' + a.name.substring(a.name.length - 3);
                else
                  a.displayName = a.name;
              });
              let parameters = {
                parameterList: _.slice(currentMeterParameters, 0, 5)
              };
              let templateHtml = template('parameter-list-template', parameters);
              $('.parameter-right').html(templateHtml);
              searchMeterData();
              setTimeout(() => {
                $('.parameter-right>div.para-item').on('click', function (e) {
                  e.stopPropagation();
                  let currentDom = e.currentTarget;
                  let unit = $(currentDom).attr('data-unit');
                  let type = $(currentDom).attr('data-type');
                  let id = $(currentDom).attr('data-id');
                  let hasChooseParameter = _.find(currentMeterParameters, a => a.isChecked && a.id !== id);
                  if (hasChooseParameter && hasChooseParameter.unit !== unit) {
                    _.each(currentMeterParameters, a => {
                      a.isChecked = false;
                    });
                    $('.parameter-right>.para-active').removeClass('para-active');
                  }
                  let chooseNode = _.find(currentMeterParameters, a => a.id === id);
                  let checkedNodes = _.filter(currentMeterParameters, a => a.isChecked);
                  if (chooseNode.isChecked && checkedNodes.length <= 1) {
                    toastr.warning('至少需要选择一个参数');
                    return;
                  }
                  chooseNode.isChecked = !chooseNode.isChecked;
                  $(currentDom).toggleClass('para-active');
                  searchMeterData();
                });
              }, 100);
            }
          });
          esdpec.framework.core.getJsonResult('dataanalysis/getmeterinfobymeterid?meterId=' + nodeId, function (response) {
            if (response.IsSuccess) {
              let meterInfo = response.Content;
              meterInfo.area = getMeterBelongArea(nodeId);
              meterInfo.status = getMeterStatus(meterInfo.state);
              let templateData = {
                data: meterInfo
              }
              let templateHtml = template('meter-info-template', templateData);
              $('.info-table').html(templateHtml);
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

  toastr.options = _.merge(toastr.options, {
    positionClass: "toast-top-center",
    closeButton: true,
    closeDuration: 100,
    closeMethod: 'fadeOut',
    closeEasing: 'swing'
  });
});