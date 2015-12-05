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
    var editor = ace.edit("editor");
    ready(function () {
        editor.focus(); //To focus the ace editor
        var n = editor.getSession().getValue().split("\n").length; // To count total no. of lines
        editor.gotoLine(n - 2); //Go to end of document
        editor.navigateLineEnd(); // Navigate to end of line
    });
    var socket = io();
    document.querySelector("#submit").onclick = function () {
        var code = editor.getValue(),
            args = document.querySelector("#args-list").value,
            input = document.querySelector("#input-text").value;

        var codejson = {
            code:code,
            args:args,
            input:input
        };
        //console.log(code);
        document.querySelector("#submit").innerText = "Submitting...";
        Materialize.toast("Submission underway...",1000);
        socket.emit('code submission', codejson);
    };

    document.querySelector("#cla").onclick = function () {
        document.querySelector("#args-list").focus();
    };
    document.querySelector("#stdin").onclick = function () {
        document.querySelector("#input-text").focus();
    };

    document.querySelector("#clear-args").onclick = function () {
        document.querySelector("#args-list").value = "";
    };
    document.querySelector("#clear-input").onclick = function () {
        document.querySelector("#input-text").value = "";
        $('#input-text').trigger('autoresize');
    };

    socket.on("shell output", function (reply) {
        var today = new Date();
        var h = today.getHours();
        var m = today.getMinutes();
        var s = today.getSeconds();

        h = h<10?"0"+h:h;
        m = m<10?"0"+m:m;
        s = s<10?"0"+s:s;

        now = h + ':' + m + ':' + s;

        console.log(reply);
        document.querySelector("#output").innerHTML = now + " >> " + reply + "<br>" + document.querySelector("#output").innerHTML;
        document.querySelector("#submit").innerText = "SUBMIT!";
        Materialize.toast("Output returned.",1000);
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
    $(document).ready(function(){
        $('.modal-trigger').leanModal();
    });
    //window.onbeforeunload = goodbye;
})();