/**
 * Created by toor on 15-11-11.
 */
/*stringify = function (obj) {
    var result;
    if ("function" == typeof obj) {
        result = obj.toString().replace(/ \{[\s\S]*$/, "");
    } else if ("undefined" == typeof obj) {
        result = "undefined";
    } else if ("string" != typeof obj) {
        result = JSON.stringify(obj);
    } else {
        result = obj;
    }
    return result;
};

console.log(stringify(stringify));
console.log(stringify("undefined"));
console.log(stringify("aaaaaa"));
console.log(stringify(11));
console.log(stringify({}));*/
var a = 1 && 2 && 3;
console.log(a);

1 == 0 || 2 >0 ? a = 5 : a = 6;
console.log(a);
var result = "ng-click".replace(/([\:\-\_]+(.))/g, function (_, separator, letter, offset) {
	if(offset){
		return letter.toUpperCase();
	}
	return  letter;
});

console.log(result);
//function replacer(match, p1, p2, p3, offset, string) {
//	// p1 is nondigits, p2 digits, and p3 non-alphanumerics
//	return [p1, p2, p3].join(' - ');
//}
//var newString = 'abc12345#$*%'.replace(/([^\d]*)(\d*)([^\w]*)/, replacer);
//match	匹配的子串。（对应于上述的$&。）
//p1,p2, ...
//假如replace()方法的第一个参数是一个RegExp 对象，则代表第n个括号匹配的字符串。（对应于上述的$1，$2等。）
//
//offset
//匹配到的子字符串在原字符串中的偏移量。（比如，如果原字符串是“abcd”，匹配到的子字符串时“bc”，那么这个参数将时1）
//
//string	被匹配的原字符串。
