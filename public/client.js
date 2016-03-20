var homeAutomationDashboard = (function() {

    var allDeviceIds = [];
    var refreshDashboardInSeconds = 10;
	/**
	 * Get all device configurations and init Home automation Dashboard
	 */
	var initDashboard = function() {
        // Init tabs
        $( "#dashboard-tabs" ).tabs();

        // load Device configuration and add device widgets to dashboard
		$.getJSON("devices.json", function( data ) {
            $("#deviceConfigName").text(data.name);
            $.each(data.homedevices, function(key, deviceConfig) {
                $("#main-section").append('<div id="' + deviceConfig.id + '"></div>');
                // apply jquery device widget
                createDeviceWidget(deviceConfig);
            });
            // Call update on each device to retrieve new value from backend
            setInterval(function() {
                $('#refreshInfo').text("Refresh from server in " + refreshDashboardInSeconds + " seconds. Change input to send to server.");
                refreshDashboardInSeconds--;
                if (refreshDashboardInSeconds === -1) {
                    $.each(allDeviceIds, function(key, idSelector) {
                        $(idSelector).device("refresh");
                    });
                    refreshDashboardInSeconds = 10;
                }
            }, 1000);
		});
	};

    /**
     * Create the device widget according to the device
     * @param deviceConfig - The device configuration
     */
    var createDeviceWidget = function(deviceConfig) {
        var idSelector = '#' + deviceConfig.id;
        allDeviceIds.push(idSelector);
		$(idSelector).device();
        $(idSelector).device("option", { device: deviceConfig });
    };

	return {
		initDashboard: initDashboard
	};
})();

var widgetManager = (function() {
	var createWidgets = function() {
		$.widget("homeautomation.device", {
			_create: function() {
				this._device = $('<div class="device"></div>');
				$(this.element).append(this._device);
			},
			_setOption: function(key, device) {
                var widgetInstance = this;
                this.options.deviceInfo = device;
				this._device.addClass(device.type);
				this._device.text(device.name);
				this._device.append('<img src="' + device.imageurl +'" height="42" width="42">');

                // Device type lightswitch
				if (device.type==='lightswitch') {
					this._device.append('<a id="btnLight_' + device.id + '" href="#" class="toggler">&nbsp;</a>');
                    $('#btnLight_' + device.id).click(function(){
                        $(this).toggleClass('off');
                        var newValue;
                        if ($(this).hasClass('off')) {
                            newValue = 'off';
                        } else {
                            newValue = 'on';
                        }
                        widgetInstance._sendDeviceUpdate(widgetInstance.options.deviceInfo, { "value": newValue });
                    });
				}

                // Device type heater
                if (device.type==='heater') {
                    var inputAndDisplayMarkup = '<input id="txtHeater_' + device.id + '"size="2" readonly>';
                    inputAndDisplayMarkup = inputAndDisplayMarkup + '<span>' + device.unit + '</span>';
                    this._device.append(inputAndDisplayMarkup);
                    $('#txtHeater_' + device.id).spinner({
                        spin: function (event, ui) {
                            widgetInstance._sendDeviceUpdate(widgetInstance.options.deviceInfo, { "value": ui.value });
                        },
                        min: widgetInstance.options.deviceInfo.minValue,
                        max: widgetInstance.options.deviceInfo.maxValue
                    });
                }

                // Device type curtains
                if (device.type==='curtains') {
                    this._device.append('<a id="btnCurtains_' + device.id + '" href="#" class="toggler">&nbsp;</a>');
                    $('#btnCurtains_' + device.id).click(function(){
                        $(this).toggleClass('closed');
                        var newValue;
                        if ($(this).hasClass('closed')) {
                            newValue = 'closed';
                        } else {
                            newValue = 'open';
                        }
                        widgetInstance._sendDeviceUpdate(widgetInstance.options.deviceInfo, { "value": newValue });
                    });
                }

                // Your new device type
                // ....
			},
            refresh: function () {
                var widgetInstance = this;
                $.getJSON(this.options.deviceInfo.dataurl, function(devicedata) {
                    // Device type lightswitch
                    if (widgetInstance.options.deviceInfo.type==='lightswitch') {
                        if (devicedata.value === 'off') {
                            $('#btnLight_' + widgetInstance.options.deviceInfo.id).addClass('off');
                        } else {
                            $('#btnLight_' + widgetInstance.options.deviceInfo.id).removeClass('off');
                        }
                    }
                    // Device type heater
                    if (widgetInstance.options.deviceInfo.type==='heater') {
                        $('#txtHeater_' + widgetInstance.options.deviceInfo.id).val(devicedata.value);
                    }
                    // Device type curtains
                    if (widgetInstance.options.deviceInfo.type==='curtains') {
                        if (devicedata.value === 'closed') {
                            $('#btnCurtains_' + widgetInstance.options.deviceInfo.id).addClass('closed');
                        } else {
                            $('#btnCurtains_' + widgetInstance.options.deviceInfo.id).removeClass('closed');
                        }
                    }

                    // Your new device type
                    // ....
                });
            },
            _sendDeviceUpdate: function(deviceInfo, data) {
                $.ajax({
                    type: "POST",
                    url: deviceInfo.dataurl,
                    data: data,
                    contentType:"application/json; charset=utf-8",
                    dataType:"json"
                });
            }
		});
	};
	return {
		createWidgets: createWidgets
	};
})();

/**
 * Main home automation initialization
 */
$(document).ready(function() {
	// Create all jQuery HouseDevice widgets
	widgetManager.createWidgets();

	// Initialize our Home automation dashboard
	homeAutomationDashboard.initDashboard();
});
