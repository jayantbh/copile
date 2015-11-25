/**
 * Created by jayantbhawal on 25/11/15.
 */
function ready(fn) {
    if (document.readyState != 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}
(function () {
    editor.setValue("#include \<stdio.h\>\nint main\(\)\{\n\t\n\treturn 0;\n}");
    ready(function () {
        editor.focus(); //To focus the ace editor
        var n = editor.getSession().getValue().split("\n").length; // To count total no. of lines
        editor.gotoLine(n - 2); //Go to end of document
        editor.navigateLineEnd(); // Navigate to end of line
    });
    var socket = io();
    document.querySelector("#submit").onclick = function () {
        var code = editor.getValue();
        //console.log(code);

        socket.emit('code submission', code);
    };

    socket.on("shell output", function (reply) {
        var today = new Date();
        var h = today.getHours();
        var m = today.getMinutes();
        var s = today.getSeconds();

        now = h + ':' + m + ':' + s;

        console.log(reply);
        document.querySelector("#output").innerHTML = now + " >> " + reply + "<br>" + document.querySelector("#output").innerHTML;
    });

    function goodbye(e) {
        if (!e) e = window.event;
        e.cancelBubble = true;
        e.returnValue = 'Tired of coding already?';

        //e.stopPropagation works in Firefox.
        if (e.stopPropagation) {
            e.stopPropagation();
            e.preventDefault();
        }
    }

    window.onbeforeunload = goodbye;
})();