(function (win,doc) {
    var test = doc.getElementById('test');
    var css  = test.innerHTML;
    var parser = new parserlib.css.Parser({ 
        starHack: true,
        underscoreHack: true,
        ieFilters: true
    });
    parser.addListener("startrule", function(event){
        console.log(event.selectors);
        console.log(event);
    });

    parser.addListener("endrule", function(event){
        console.log("Ending rule with selectors [" + event.selectors + "]");
    });
    parser.addListener("property", function(event){
        console.log("property[" + event.property + ":" + event.value + "]");
        console.log(event);
    });


    parser.addListener("error", function(event){
        //console.log("Parse error: " + event.message + " (" + event.line + "," + event.col + ")", "error");
        //console.log(event);
    });
    parser.parse(css);

})(window,document);
