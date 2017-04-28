/**
 * Created by toor on 15-9-6.
 */
/**
 * @author
 * filter 加密账号    1234****5678
 */
(function(window, vx) {
    'use strict';

    function encryptAcNo() {
        return function(input) {
            if (input !== undefined)
                return input.substring(0, 4) + "****" + input.substring(input.length - 4);
        };
    }


    vx.module('ui.libraries').filter('encryptAcNo', encryptAcNo);

})(window, window.vx);