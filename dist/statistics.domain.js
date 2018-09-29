$(function () {
  //#region fields 
  let analysisChart = null;
  let meterDataList = [];
  let searchResult = {};
  let currentSelectedNode = null;
  let currentMeterParameters = [];
  let comparsionSelectedMeters = [];
  let areaSubscribeModule = [];
  let areaConfigureMeters = [];
  //#endregion
  let ifShowPieChart = function () {
    let flag = false;
    $('.operate-grp>i.should-uniq.btn-active').each(function (index, dom) {
      flag = $(dom).attr('data-value') === 'pie';
      if (flag) return false;
    });
    return flag;
  };
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
  let getSelectParameterLen = function () {
    return $('.parameter-right>.para-active').length;
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
      _.each(data.now_data_list || data.data_list, now => {
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
        var valueItem = _.find(data.now_data_list || data.data_list, b => b.date === a);
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
            name: '下限报警',
            itemStyle: {
              normal: {
                color: '#dc143c'
              }
            },
            tooltip: {
              trigger: 'item',
              formatter: function (params) {
                return params.seriesName + "<br/>" + params.data.name + ": " + params.data.value;
              }
            },
            yAxis: rule.LowerLimit
          });
          if (rule.LowerWave != null) {
            let waveValue = rule.LowerLimit + rule.LowerWave;
            series.markLine.data.push({
              name: '下限预警',
              itemStyle: {
                normal: {
                  color: '#FF8C00'
                }
              },
              tooltip: {
                trigger: 'item',
                formatter: function (params) {
                  return params.seriesName + "<br/>" + params.data.name + ": " + params.data.value;
                }
              },
              yAxis: waveValue
            });
          }
        }
        if (rule.UpperLimit != null) {
          series.markLine.data.push({
            name: '上限报警',
            itemStyle: {
              normal: {
                color: '#dc143c'
              }
            },
            tooltip: {
              trigger: 'item',
              formatter: function (params) {
                return params.seriesName + "<br/>" + params.data.name + ": " + params.data.value;
              }
            },
            yAxis: rule.UpperLimit
          });
          if (rule.UpperWave != null) {
            let waveValue = rule.UpperLimit - rule.UpperWave;
            series.markLine.data.push({
              name: '上限预警',
              itemStyle: {
                normal: {
                  color: '#FF8C00'
                }
              },
              tooltip: {
                trigger: 'item',
                formatter: function (params) {
                  return params.seriesName + "<br/>" + params.data.name + ": " + params.data.value;
                }
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
        var valueItem = _.find(data.now_data_list || data.data_list, b => b.date === a);
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
    if (currentMeterParameters.length <= 0) {
      toastr.warning('请先选择查询仪表');
      return;
    }
    let currentSelectedParameters = _.filter(currentMeterParameters, a => a.isChecked);
    if (currentSelectedParameters.length <= 0) return;
    let parameter = _.head(currentSelectedParameters);
    let dateType = getSearchDateType();
    let searchDateType = dateType === -1 ? 2 : dateType;
    let searchParaType = dateType === -1 ? 1 : parameter.type;
    let defaultTimeStr = getDefaultSTimeAndETime(searchDateType);
    let sTime = defaultTimeStr.split('--')[0];
    let eTime = defaultTimeStr.split('--')[1];
    if (comparsionSelectedMeters.length > 0) {
      $('.comparison-tab').show();
      $('.func-tab').hide();
      $('#summary-container').hide();
      if (searchParaType === 0) {
        $('#pie').show();
      } else {
        $('#pie').hide();
      }
      let mIds = _.map(comparsionSelectedMeters, a => a.id);
      esdpec.framework.core.getJsonResult('dataanalysis/getparasbymeterids?meterIds=' + _.join(mIds, ','), function (response) {
        if (response.IsSuccess) {
          let mfids = [parameter.id];
          let meterAndParaMap = [{
            name: currentSelectedNode.text,
            mfid: parameter.id,
            id: parameter.id
          }];
          _.each(comparsionSelectedMeters, a => {
            let result = _.find(response.Content, rtn => rtn.meterId === a.id);
            a.parameters = result ? result.mfList : [];
            let para = _.find(result.mfList, a => a.name === parameter.name);
            if (para) {
              para.isChecked = true;
              mfids.push(para.id);
              meterAndParaMap.push({
                name: a.text,
                mfid: para.id,
                id: para.id
              });
            }
          });
          let uriparams = `mfids=${_.join(mfids, ',')}&paraType=${searchParaType}&dateType=${searchDateType}&sTime=${sTime}&eTime=${eTime}`;
          esdpec.framework.core.getJsonResult('dataanalysis/getcomparedata?' + uriparams, function (response) {
            if (response.IsSuccess) {
              let chartLegend = [];
              let chartXaxisData = [];
              chartLegend = _.map(meterAndParaMap, a => a.name);
              chartXaxisData = searchParaType === 0 ? getXAxisData(dateType, sTime, eTime) : getOriginalXAxisData(response.Content);
              searchResult = {
                unit: parameter.unit,
                chartLegend,
                chartXaxisData,
                datas: response.Content,
                checkedParameters: parameter,
                type: searchParaType,
                meterAndParaMap
              };
              generateComparisonData(meterAndParaMap, response.Content, searchParaType);
              if (ifShowPieChart()) {
                generatePieChart();
              } else
                assembleChartComponent(parameter.unit, chartLegend, chartXaxisData, response.Content, meterAndParaMap, getChartType());
            }
          });
        }
      });
    } else {
      $('.comparison-tab').hide();
      $('.func-tab').show();
      $('#summary-container').show();
      let mfids = _.map(currentSelectedParameters, a => a.id);
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
    esdpec.framework.core.getJsonResult('dataanalysis/getlastcollectdata?meterId=' + nodeId, function (response) {
      if (response.IsSuccess) {
        let data = {
          parameterList: response.Content
        };
        _.each(data.parameterList, a => {
          let last = _.head(a.last_datas);
          a.lastDate = last ? _.replace(last.Mt, 'T', ' ').substring(0, 19) : '--';
          a.lastVal = last ? last.Mv : '--';
        });
        let templateHtml = template('original-table-body-template', data);
        $('#original-table-body').html(templateHtml);
        $('#original-table-body tr>td').on('click', function (e) {
          e.stopPropagation();
          let currentDom = e.currentTarget;
          let id = $(currentDom).attr('data-id');
          let para = _.find(data.parameterList, a => a.mfid === id);
          let lastDatas = para ? para.last_datas : [];
          let historyData = {
            historyList: lastDatas
          };
          _.each(historyData.historyList, a => {
            a.Mt = _.replace(a.Mt, 'T', ' ').substring(0, 19);
            a.ST = _.replace(a.ST, 'T', ' ').substring(0, 19);
          });
          let templateHtml = template('history-data-list-body-template', historyData);
          $('.history-data-list-body').html(templateHtml);
          $('#original-history-data').dialogModal({
            onLoad: () => {
              setTimeout(() => {
                $('.open #lastUnit').text('读数(' + para.unit + ')');
                $('.open #history-header').text(para.name + '历史读数');
              }, 150);
            }
          });
        });
      }
    });
  };
  let generatePeakData = function () {

  };
  let generatePieChart = function () {
    let datas = [];
    let legends = [];
    _.each(searchResult.datas, data => {
      let sumVal = {
        name: data.meter_name,
        value: data.sum_val ? data.sum_val : 0
      };
      datas.push(sumVal);
      legends.push(data.meter_name);
    });
    let option = generatePieForAggregateData(legends, datas, searchResult.unit);
    analysisChart.clear();
    analysisChart = echarts.init(document.getElementById('chart-instance'), e_macarons);
    analysisChart.setOption(option, true);
    window.onresize = analysisChart.resize;
  };
  let generateComparisonData = function (meterAndParaMap, resultData, type) {
    let data = {
      comparisonList: resultData,
      type
    };
    _.each(data.comparisonList, a => {
      let map = _.find(meterAndParaMap, m => m.mfid === a.mfid);
      a.meter_name = map ? map.name : '--';
      a.sum_val = _.isString(a.sum_val) ? a.sum_val : (_.isNumber(a.sum_val) && _.toLower(a.sum_val) !== 'infinity') ? a.sum_val.toFixed(2) : '--';
      a.sum_per = _.isString(a.sum_per) ? a.sum_per : (_.isNumber(a.sum_per) && _.toLower(a.sum_per) !== 'infinity') ? a.sum_per.toFixed(2) : '--';
      a.all_avg_val = _.isString(a.all_avg_val) ? a.all_avg_val : (_.isNumber(a.all_avg_val) && _.toLower(a.all_avg_val) !== 'infinity') ? a.all_avg_val.toFixed(2) : '--';
      a.avg_val = _.isString(a.avg_val) ? a.avg_val : (_.isNumber(a.avg_val) && _.toLower(a.avg_val) !== 'infinity') ? a.avg_val.toFixed(2) : '--';
      a.max_val = _.isString(a.max_val) ? a.max_val : (_.isNumber(a.max_val) && _.toLower(a.max_val) !== 'infinity') ? a.max_val.toFixed(2) : '--';
      a.min_val = _.isString(a.min_val) ? a.min_val : (_.isNumber(a.min_val) && _.toLower(a.min_val) !== 'infinity') ? a.min_val.toFixed(2) : '--';
      a.upper_limit = a.rule ? (a.rule.UpperLimit ? ((_.isNumber(a.rule.UpperLimit) && _.toLower(a.rule.UpperLimit) !== 'infinity') ? a.rule.UpperLimit.toFixed(2) : '--') : '--') : '--';
      a.lower_limit = a.rule ? (a.rule.LowerLimit ? ((_.isNumber(a.rule.LowerLimit) && _.toLower(a.rule.LowerLimit) !== 'infinity') ? a.rule.LowerLimit.toFixed(2) : '--') : '--') : '--';
    });
    if (type === 0) $('.no-show-in').show();
    else $('.no-show-in').hide();
    let templateHtml = template('comparison-table-body-template', data);
    $('#comparison-table-body').html(templateHtml);
  };
  let areaWindowInteractive = function () {
    $('#area-zone').show();
    $('#meter-zone').hide();
    $('.func-tab').hide();
    $('#onshowmeterinfo').hide();
    $('.content-footer').hide();
    $('.module-container').show();
    $('.comparison-tab').hide();
  };
  let meterWindowInteractive = function () {
    $('#area-zone').hide();
    $('#meter-zone').show();
    $('.func-tab').show();
    $('#onshowmeterinfo').show();
    $('.content-footer').show();
    $('.module-container').hide();
    if (ifShowPieChart()) $('.comparison-tab').show();
  };
  let bindingMeterTree = function (selector) {
    $(selector).jstree({
      "core": {
        "multiple": false,
        "themes": {
          "responsive": false
        },
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
      let node = data.node.original;
      if (node.modeltype !== 'area') {
        if (areaConfigureMeters.length === 0) {
          areaConfigureMeters.push(node);
        } else {
          let head = _.head(areaConfigureMeters);
          let energyType = head.EnergyCode;
          if (energyType !== node.EnergyCode) {
            toastr.warning('只能配置同一种能源类型的仪表，请重新选择');
            return;
          }
          areaConfigureMeters.push(node);
        }
        bindSelectedMeterList();
      }
    });
  };
  let bindSelectedMeterList = function () {
    let data = {
      selectedMeterList: areaConfigureMeters
    };
    let templateHtml = template('selected-meter-list-template', data);
    $('.meter-list').html(templateHtml);
    setTimeout(() => {
      $('.open .meter-list .select-meter-item>input').on('click', function (e) {
        e.stopPropagation();
        let currentDom = e.currentTarget;
        $(currentDom).parent().remove();
        let id = $(currentDom).attr('data-id');
        _.remove(areaConfigureMeters, a => a.id === id);
      });
    }, 100);
  }
  let showModuleConfigureModal = function () {
    $('.configure-header>.binding-data').removeClass('layui-this');
    $('.binding-data>span').removeClass('finish');
    $('.page-binding-data').hide();
    $('.page-configure-func').show();
    $('#dialog_content').dialogModal({
      onOkBut: function () {
        console.log('save');
      },
      onCancelBut: function () {},
      onLoad: function () {
        setTimeout(() => {
          $('.open .dialogModal_content ul.layui-tab-title>li').on('click', function (e) {
            e.stopPropagation();
            let currentDom = e.currentTarget;
            let id = $(currentDom).attr('data-id');
            if (id === 'configure-func') {
              $('.binding-data').removeClass('layui-this');
              $('.binding-data>span').removeClass('finish');
              $('.page-configure-func').show();
              $('.page-binding-data').hide();
            } else if (id === 'binding-data') {
              $('.binding-data').addClass('layui-this');
              $('.binding-data>span').addClass('finish');
              $('.page-configure-func').hide();
              $('.page-binding-data').show();
              if ($('.open .meter-tree').html() === '')
                bindingMeterTree('.open .meter-tree');
              bindSelectedMeterList();
            }
          });
          $('.open .func-list>div').on('click', function (e) {
            e.stopPropagation();
            let currentDom = e.currentTarget;
            let currentModule = $(currentDom).children().first().children().first();
            if (currentModule.attr('checked') === 'checked') {
              currentModule.removeAttr('checked');
              //_.remove(areaSubscribeModule, a=>a) 
            } else {
              currentModule.attr('checked', 'checked');
              //areaSubscribeModule.push()
            }
          });
          if (areaSubscribeModule.length > 0) {
            //TODO 初始化绑定区域模块和作用范围

          }
        }, 150);
      },
      onClose: function () {},
    });
  };
  let generatePieForAggregateData = (xAxisData, seriesData, unit) => {
    let option = {
      title: {
        subtext: '单位：' + unit
      },
      tooltip: {
        trigger: 'item',
        formatter: "{a} <br/>{b} : {c} ({d}%)"
      },
      legend: {
        orient: 'horizontal',
        left: 'center',
        data: xAxisData
      },
      series: [{
        name: '能耗对比',
        type: 'pie',
        center: ['50%', '60%'],
        label: {
          normal: {
            position: 'inner'
          }
        },
        data: seriesData,
        itemStyle: {
          normal: {
            label: {
              show: true,
              formatter: "{c} ({d}%)"
            }
          },
          emphasis: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
    return option;
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
    let flag = $(currentDom).attr('data-value');
    if ($(currentDom).hasClass('should-uniq')) {
      $('.operate-grp i.should-uniq').removeClass('btn-active');
      $(currentDom).addClass('btn-active');
    } else {
      $(currentDom).toggleClass('btn-active');
    }
    //TODO
    let chartSeries = [];
    switch (flag) {
      //#region rmb
      case 'rmb':
        if (ifShowPieChart()) return;
        if (comparsionSelectedMeters.length > 0) {
          chartSeries = getChartSeries(searchResult.datas, searchResult.meterAndParaMap, searchResult.chartXaxisData, getChartType(),
            $('.show-tip').hasClass('btn-active') ? true : false);
        } else {
          chartSeries = getChartSeries(searchResult.datas, _.map(searchResult.checkedParameters, a => {
            return {
              id: a.id,
              name: a.name
            };
          }), searchResult.chartXaxisData, getChartType(), $('.show-tip').hasClass('btn-active') ? true : false);
        }
        if ($(currentDom).hasClass('btn-active')) {
          let costSeries = [];
          if (comparsionSelectedMeters.length > 0) {
            costSeries = getChartSeriesForCost(searchResult.datas, searchResult.meterAndParaMap, searchResult.chartXaxisData,
              $('.show-tip').hasClass('btn-active') ? true : false);
          } else {
            costSeries = getChartSeriesForCost(searchResult.datas, _.map(searchResult.checkedParameters, a => {
              return {
                id: a.id,
                name: a.name
              };
            }), searchResult.chartXaxisData, $('.show-tip').hasClass('btn-active') ? true : false);
          }
          chartSeries = _.concat(chartSeries, costSeries);
        }
        break;
        //#endregion
        //#region bar
      case 'bar':
        if (comparsionSelectedMeters.length > 0) {
          chartSeries = getChartSeries(searchResult.datas, searchResult.meterAndParaMap, searchResult.chartXaxisData, 'bar',
            $('.show-tip').hasClass('btn-active') ? true : false);
        } else {
          chartSeries = getChartSeries(searchResult.datas, _.map(searchResult.checkedParameters, a => {
            return {
              id: a.id,
              name: a.name
            };
          }), searchResult.chartXaxisData, 'bar', $('.show-tip').hasClass('btn-active') ? true : false);
        }
        if ($('.icon-RMB').hasClass('btn-active')) {
          let costSeries = [];
          if (comparsionSelectedMeters.length > 0) {
            costSeries = getChartSeriesForCost(searchResult.datas, searchResult.meterAndParaMap,
              searchResult.chartXaxisData, $('.show-tip').hasClass('btn-active') ? true : false);
          } else {
            costSeries = getChartSeriesForCost(searchResult.datas, _.map(searchResult.checkedParameters, a => {
              return {
                id: a.id,
                name: a.name
              };
            }), searchResult.chartXaxisData, $('.show-tip').hasClass('btn-active') ? true : false);
          }
          chartSeries = _.concat(chartSeries, costSeries);
        }
        break;
        //#endregion
        //#region line
      case 'line':
        if (comparsionSelectedMeters.length > 0) {
          chartSeries = getChartSeries(searchResult.datas, searchResult.meterAndParaMap, searchResult.chartXaxisData, 'line',
            $('.show-tip').hasClass('btn-active') ? true : false);
        } else {
          chartSeries = getChartSeries(searchResult.datas, _.map(searchResult.checkedParameters, a => {
            return {
              id: a.id,
              name: a.name
            };
          }), searchResult.chartXaxisData, 'line', $('.show-tip').hasClass('btn-active') ? true : false);
        }
        if ($('.icon-RMB').hasClass('btn-active')) {
          let costSeries = [];
          if (comparsionSelectedMeters.length > 0) {
            costSeries = getChartSeriesForCost(searchResult.datas, searchResult.meterAndParaMap,
              searchResult.chartXaxisData, $('.show-tip').hasClass('btn-active') ? true : false);
          } else {
            costSeries = getChartSeriesForCost(searchResult.datas, _.map(searchResult.checkedParameters, a => {
              return {
                id: a.id,
                name: a.name
              };
            }), searchResult.chartXaxisData, $('.show-tip').hasClass('btn-active') ? true : false);
          }
          chartSeries = _.concat(chartSeries, costSeries);
        }
        break;
        //#endregion
      case 'pie':
        generatePieChart();
        return;
      case 'download':

        return;
        //#region tip
      case 'tip':
        if (ifShowPieChart()) return;
        if (comparsionSelectedMeters.length > 0) {
          chartSeries = getChartSeries(searchResult.datas, searchResult.meterAndParaMap, searchResult.chartXaxisData, getChartType(),
            $(currentDom).hasClass('btn-active') ? true : false);
        } else {
          chartSeries = getChartSeries(searchResult.datas, _.map(searchResult.checkedParameters, a => {
            return {
              id: a.id,
              name: a.name
            };
          }), searchResult.chartXaxisData, getChartType(), $(currentDom).hasClass('btn-active') ? true : false);
        }
        if ($('.icon-RMB').hasClass('btn-active')) {
          let costSeries = [];
          if (comparsionSelectedMeters.length > 0) {
            costSeries = getChartSeriesForCost(searchResult.datas, searchResult.meterAndParaMap, searchResult.chartXaxisData,
              $(currentDom).hasClass('btn-active') ? true : false);
          } else {
            costSeries = getChartSeriesForCost(searchResult.datas, _.map(searchResult.checkedParameters, a => {
              return {
                id: a.id,
                name: a.name
              };
            }), searchResult.chartXaxisData, $(currentDom).hasClass('btn-active') ? true : false);
          }
          chartSeries = _.concat(chartSeries, costSeries);
        }
        break;
        //#endregion
    }
    generateChart(searchResult.unit, searchResult.chartLegend, searchResult.chartXaxisData, chartSeries);
  });

  $('.func-tab .layui-tab-title>li').on('click', function (e) {
    e.stopPropagation();
    let currentDom = e.currentTarget;
    $('.func-tab .layui-tab-title>li').removeClass("layui-this");
    $('.func-tab .layui-tab-content>div').hide();
    $(currentDom).addClass('layui-this');
    $('#' + $(currentDom).attr('data-id')).show();
  })

  $('#area-zone .operate-hander').on('click', function (e) {
    e.stopPropagation();
    showModuleConfigureModal();
  });

  $('.content__header--btngrp .module-container').on('click', function (e) {
    e.stopPropagation();
    showModuleConfigureModal();
  });

  $('.comparsion-left>.meter-choose').on('click', function (e) {
    e.stopPropagation();
    if (getSelectParameterLen() > 1) {
      toastr.warning('只能单参数对比');
      return;
    }
    $('#choose-meter-for-comparison').dialogModal({
      onOkBut: function () {
        let nodeIds = $(".open .choose-meter-list").jstree("get_checked");
        let nodes = _.filter(meterDataList, a => _.includes(nodeIds, a.id));
        comparsionSelectedMeters = [];
        comparsionSelectedMeters = _.concat([], nodes);
        let data = {
          comparisonMeterList: comparsionSelectedMeters
        };
        let templateHtml = template('comparsion-right-template', data);
        $('.comparsion-right').html(templateHtml);
        setTimeout(() => {
          $('.comparsion-right .meter-item>i').on('click', function (e) {
            e.stopPropagation();
            let currentDom = e.currentTarget;
            let meterId = $(currentDom).attr('data-id');
            $(currentDom).parent().remove();
            let removeMeter = _.remove(comparsionSelectedMeters, a => a.id === meterId);
            if (comparsionSelectedMeters.length > 0) {
              //remove comparison data: remove chart data and parameter detail info
              if (removeMeter && removeMeter.length > 0) {
                let p = _.find(removeMeter[0].parameters, a => a.isChecked);
                _.remove(searchResult.datas, a => a.mfid === p.id);
                generateComparisonData(searchResult.meterAndParaMap, searchResult.datas, searchResult.type);
                //generateComparisonChartData();
                if (ifShowPieChart()) {
                  generatePieChart();
                } else {
                  let chartSeries = getChartSeries(searchResult.datas, searchResult.meterAndParaMap, searchResult.chartXaxisData, getChartType(),
                    $('.show-tip').hasClass('btn-active') ? true : false);
                  if ($('.icon-RMB').hasClass('btn-active')) {
                    let costSeries = getChartSeriesForCost(searchResult.datas, searchResult.meterAndParaMap, searchResult.chartXaxisData,
                      $(currentDom).hasClass('btn-active') ? true : false);
                    chartSeries = _.concat(chartSeries, costSeries);
                  }
                  generateChart(searchResult.unit, _.map(searchResult.datas, a => a.meter_name), searchResult.chartXaxisData, chartSeries);
                }
              }
            } else {
              if (ifShowPieChart()) {
                $('#pie').removeClass('btn-active').hide();
                $('#bar').addClass('btn-active');
              }
              searchMeterData();
            }
          });
        }, 150);
        searchMeterData();
      },
      onCancelBut: function () {},
      onLoad: function () {
        setTimeout(() => {
          if ($('.open .choose-meter-list').html() === '') {
            $('.open .choose-meter-list').jstree({
              "core": {
                "multiple": true,
                "themes": {
                  "responsive": false
                },
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
              "plugins": ["types", "search", "crrm", "checkbox"],
              "checkbox": {
                "keep_selected_style": false
              },
            }).on('loaded.jstree', function (e, data) {
              let instance = data.instance;
              let target = instance.get_node(e.target.firstChild.firstChild.lastChild);
              instance.open_node(target);
              _.each(comparsionSelectedMeters, meter => {
                instance.select_node(instance.get_node(meter.id));
              });
            });
            setTimeout(() => {

            }, 1000);
          }
        }, 150);
      },
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
        if (node.original.modeltype === 'area') {
          currentMeterParameters = [];
          areaWindowInteractive();
          // esdpec.framework.core.getJsonResult('dataanalysis/getparasbymeterid', function (response) {
          //   if (response.IsSuccess) {
          //     areaSubscribeModule = [];
          //     if (areaSubscribeModule.length <= 0) {

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
                  if (comparsionSelectedMeters.length > 0) {
                    $('.parameter-right>.para-active').removeClass('para-active');
                    $(currentDom).addClass('para-active');
                    _.each(currentMeterParameters, a => a.isChecked = false);
                    let currentMeter = _.find(currentMeterParameters, a => a.id === id);
                    currentMeter.isChecked = true;
                    if (type !== 0) {
                      $('.operate-grp>i.should-uniq').removeClass('btn-active');
                      $('.operate-grp>i.should-uniq').first().addClass('btn-active');
                    }
                  } else {
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
                  }
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