/**
 * Created by toor on 15-9-6.
 */
(function (window, vx, undefined) {
    'use strict';

    var service = {};
    service.$nativeCall = ["$os", "$log", '$rootScope', '$targets',
        function ($os, $log, $rootScope, $targets) {
            var tNative = {};

            return tNative;
        }];
    service.$myservice = ["$filter", function ($filter) {
        var serviceObj = {};
        serviceObj.getDate = function (days, format) {
            // TODO 添加函数过程
            format = format || 'yyyy-MM-dd';
            if (days) {
                var group = days.match(/(\d+)([dDMmWw])/);
                var value = group[1],
                    type = group[2].toUpperCase();
                if (type === 'D')
                    return $filter('date')(new Date(new Date().getTime() - (value * 24 * 3600 * 1000)), format);
                else if (type === 'W')
                    return $filter('date')(new Date(new Date().getTime() - (value * 7 * 24 * 3600 * 1000)), format);
                else if (type === 'M') {
                    var date = new Date();
                    date.setMonth(date.getMonth() - value);
                    return $filter('date')(date, format);
                }
            } else
                return $filter('date')(new Date(), format);
        }
        return serviceObj;
    }];
    service.otherService = [function () {
        var serviceObj = {};
        return serviceObj;
    }];

    vx.module('mapp.libraries').service(service); //注入多个服务 service或者service

})(window, window.vx);
