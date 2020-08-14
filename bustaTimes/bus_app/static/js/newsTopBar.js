
String.prototype.format = function(args) {
         var result = this;
         if (arguments.length > 0) {
             for (var i = 0; i < arguments.length; i++) {
                 if (arguments[i] != undefined) {
                     var reg= new RegExp("({)" + i + "(})", "g");
                     result = result.replace(reg, arguments[i]);
                 }
             }
         }
         return result;
     }

// Initialise some variables 
var tScrollLeft = 0;
var intervalVar;
var create = false
var display = true

// Create news bar
function createTopBar() {
    if(create) return;
    create = true;
    var contentBox = document.createElement('div');
    contentBox.onmouseover = function() {
        clearInterval(intervalVar);　　　　　
    }　　　　

    contentBox.onmouseout = function() {　　　　　　　
        intervalVar = setInterval(scrollTopBar, 50);　　　　　　　　　
    }
    contentBox.id = "news-top-bar";
    contentBox.className = "news-top-bar";
    if (!display) {
        contentBox.style = "display: none";
    }
    var img = document.createElement("img");
    img.src = "./static/images/news_icon.png";
    img.style = "width: 24px;";
    contentBox.appendChild(img);
    var topBarContent = document.createElement("div");
    topBarContent.id = "news-top-bar-content";
    contentBox.appendChild(topBarContent);
    document.getElementsByClassName("app-container")[0].appendChild(contentBox);
}

// Display notice to users when failing to update latest news.
function initTopBarOnFail() {
    createTopBar();
    var topBarContent = document.getElementById("news-top-bar-content");
    topBarContent.innerHTML = "<nobr>Failed to update latest news, please go to <a href='https://www.dublinbus.ie/News-Centre/'> https://www.dublinbus.ie/</a> for more information.</nobr>";
    startTopBarScroll();
    setTimeout(lazyInitTopBar, 180000);
}

// Request news
function lazyInitTopBar() {
    clearInterval(intervalVar);　
    var request = new XMLHttpRequest();
    var received = false;
    request.open("get", "/getnews", true);

    function abortRequest() {
        if (received) return;
        console.log('time out');
        if (request) request.abort();
        initTopBarOnFail();
    }

    request.onreadystatechange = function() {
        received = true;
        var rtn;
        if (request.readyState == 4 && request.status == 200) {
            console.log(request.response);
            rtn = JSON.parse(request.response)
            if (rtn && rtn.state == 1) {
            initTopBar(rtn)
            } else {
                initTopBarOnFail()
            }
        }
    }
    request.send();
    setTimeout(abortRequest, 10000);
}

// The content of news bar
function initTopBar(rtn) {
    createTopBar();
    var topBarContent = document.getElementById("news-top-bar-content");
    // Set the colour of the news title in accordance with the theme colour; open a new page redirecting users to news on Dublin Bus website
    topBarContent.innerHTML = "<nobr><a href='{0}'target='_blank'style='color:rgb(111, 173, 193)'>{1}</a>-{2}</nobr>".format(rtn['href'], rtn['title'], rtn['time']);
    startTopBarScroll();
}

// Content scrolling when the width of the news bar is too narrow.
function startTopBarScroll() {
    intervalVar = setInterval(scrollTopBar, 50);
}

function scrollTopBar() {
    var content = document.getElementById("news-top-bar-content");
    content.scrollLeft++;
    if (tScrollLeft == content.scrollLeft) {
        clearInterval(intervalVar);
        content.scrollLeft = 0;
        setTimeout(startTopBarScroll, 1000);
    }
    tScrollLeft = content.scrollLeft;
}

// A function to hide and display the top news bar
function hideTopBar() {
    var bar = document.getElementById("news-top-bar");
    display = !display;
    if (bar) {
        if(display) {
            bar.style = "";
        } else {
            bar.style = "display: none"
        }
    }
}

lazyInitTopBar();