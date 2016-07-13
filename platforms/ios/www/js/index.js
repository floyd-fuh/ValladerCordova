var app = {
    initialize: function() {
        this.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
	
	currentSearchword: "",
	
	searchClicked: function() {
		  	var word = $('#search').val();
			app.currentSearchword = word;
			app.spinAllClearAll();
		  	app.getUdgGerman(word);
			app.getUdgVallader(word);
			app.getPledariGerman(word);
			app.getPledariVallader(word);
			app.getVocabulario(word);
	},
	
    receivedEvent: function(id) {
		document.addEventListener('searchbutton', app.searchClicked, false);
		$(".button").click(app.searchClicked);
		$('#search').on("keyup", function(e){
			var theEvent = e || window.event;
			var keyPressed = theEvent.keyCode || theEvent.which;
			// enter key code is 13
		   	if(keyPressed === 13){
			   	app.searchClicked();
		   	}
		});
		$("#udggerman").hide();
		$("#pledarigerman").hide();		
		$('a[target=_blank]').on('click', function(e) {
			e.preventDefault();
			window.open($(this).attr('href'), '_blank');
			return false;
		});
    },
	
	spinAllClearAll: function(){
		$("#searchingthrough").hide();
		$(".list").empty();
		$(".statusimg").css("display", "inline");
		$(".statusimg").attr("src", "img/loading.gif");
		$("#udggerman").show();
		$("#pledarigerman").show();
		$("#udgvallader .link").html("Da vallader in tudais-ch,<br>resultats UDG");
		$("#udggerman .link").html("Da tudais-ch in vallader,<br>resultats UDG");
		$("#pledarivallader .link").html("Da vallader in tudais-ch,<br>resultats MeinPledari");
		$("#pledarigerman .link").html("Da tudais-ch in vallader,<br>resultats MeinPledari");
		$("#vocabulario .link").html("Da vallader in tudais-ch e viceversa,<br>resultats Vocabulario");
	},
	
	failedSelector: function(selector){
		$(selector).find('.statusimg').attr("src", "img/noresult.png");
		$(selector).appendTo($('#result-status'));
		if($(selector+" .link").html().indexOf("Suche") == -1){
			$(selector+" .link").html($(selector+" .link").html().replace("resultats", "ingüns resultats per la tschercha"));
		}
	},

	getUdgGerman: function(word){
		var selector = "#udggerman";
		var url = "http://www.udg.ch/dicziunari/vallader/idx_nor_de/q:"+encodeURIComponent(word);
		$(selector).find('.link').attr("href", url);
		$.get(url, function(data){app.gotUdg(word, data, selector)});
	},
	
	getUdgVallader: function(word){
		var selector = "#udgvallader";
		var url = "http://www.udg.ch/dicziunari/vallader/idx_nor_rm/q:"+encodeURIComponent(word);
		$(selector).find('.link').attr("href", url);
		$.get(url, function(data){app.gotUdg(word, data, selector)});
	},
	
	gotUdg: function(word, data, selector){
		if(word != app.currentSearchword){
			return;
		}
		if(data.indexOf("Glista dals resultats") != -1){
			$(selector).find('.statusimg').attr("src", "img/success.png");
			var dummydiv = $("<div>").html(data);
			var sourceNames = $(".source", dummydiv.get(0));
			var targetNames = $(".target", dummydiv.get(0));
			for (var i = 0; i < sourceNames.length; i++) {
				var source = $(sourceNames[i]).text();
				var target = $(targetNames[i]).text();
				target = target.replace("►","");
				if(target == ""){
					continue;
				}
				$(selector).find('.list').append("<li>"+source+" → "+target+"</li>");
			}
		}
		else{
			app.failedSelector(selector);
		}
	},
	
	doPostRedirect: function(url, word, german){
		var win = window.open(url, "_blank", "EnableViewPortScale=yes" );
		win.addEventListener("loadstop", function() {
		    win.executeScript({ code: "if(!"+german+"){ \
				document.tschertga.direcziun.selectedIndex = '6'; \
			}; \
			var inputs = document.getElementsByTagName('input'); \
			var origvalue = ''; \
			for(i=0; i<inputs.length; i++){ \
				if(inputs[i].type == 'text'){ \
					origvalue = inputs[i].value; \
					inputs[i].value = '"+word+"'; \
				} \
			} \
			if(origvalue == ''){ \
				document.tschertga.submit(); \
			}" });
		});
	},
	
	getPledariGerman: function(word){
		var selector = "#pledarigerman";
		var url = "http://www.pledari.ch/meinpledari/index.php";
		$(selector).find('.link').click( function(e) {e.preventDefault(); app.doPostRedirect(url, word, true); return false; } );		
		var postdata = "direcziun=0&modus=entschatta&pled="+encodeURIComponent(word)+"&tschertgar=5.+Tschertgar+%2F+suchen";
		$.post(url, postdata, function(data){app.gotPledari(word, data, selector, url, postdata, true)});
	},
	
	getPledariVallader: function(word){
		var selector = "#pledarivallader";
		var url = "http://www.pledari.ch/meinpledari/index.php";
		$(selector).find('.link').click( function(e) {e.preventDefault(); app.doPostRedirect(url, word, false); return false; } );
		var postdata = "direcziun=6&modus=entschatta&pled="+encodeURIComponent(word)+"&tschertgar=5.+Tschertgar+%2F+suchen";
		$.post(url, postdata, function(data){app.gotPledari(word, data, selector, url, postdata, true)});
	},
	
	gotPledari: function(word, data, selector, url, postdata, recurse){
		if(word != app.currentSearchword){
			return;
		}
		var treffer = 0;
		if(recurse){
			var sdata = data.replace(/(\r\n|\n|\r)/gm,"");
			var indicator = "Treffer:";
			var indicator_end = "/ Dieser Begriff:";
			if(sdata.indexOf(indicator) != -1){
				treffer = sdata.substr(sdata.indexOf(indicator)+8);
				if(treffer.indexOf(indicator_end) != -1){
					treffer = treffer.substr(0, treffer.indexOf(indicator_end));
					treffer = treffer.trim();
					treffer = parseInt(treffer);
					if(treffer < 1){
						app.failedSelector(selector);
					}
					for(i=0; i<Math.min(treffer, 33); i++){ //maximum 30, we don't want to overload the server
						$.post(url, postdata+"&nr="+i, function(data){app.gotPledari(word, data, selector, url, postdata+"&nr="+i, false)});
					}
				}
				else{
					app.failedSelector(selector);
				}
			}
			else{
				app.failedSelector(selector);
			}
		}
		
		if(!recurse || treffer > 0){
			var dummydiv = $("<div>").html(data);
			var textareas = $("textarea", dummydiv.get(0));
			if(textareas.length == 9){
				$(selector).find('.statusimg').attr("src", "img/success.png");
				var source = $(textareas[0]).text().trim();
				var target = $(textareas[6]).text().trim();
				if(target.indexOf("(=RG)") != -1){
					target = $(textareas[1]).text().trim();
				}else if(target.indexOf("-----") != -1){
					return;
				}else if(target.length < 1){
					return;
				}
				if(postdata.indexOf("direcziun=6") == -1){
					$(selector).find('.list').append("<li>"+source+" → "+target+"</li>");
				}
				else{
					$(selector).find('.list').append("<li>"+target+" → "+source+"</li>");
				}
			}
			else{
				app.failedSelector(selector);
			}
		}
	},
	
	getVocabulario: function(word){
		var selector = "#vocabulario";
		var url = "http://www.vocabulario.ch/vallader/v0.1/i.php?q="+encodeURIComponent(word);+"&action=Suchen&o=0";
		$(selector).find('.link').attr("href", url);
		var failcase_function = function(data){app.gotVocabulario(word, data.responseText, selector, url, 0)};
		$.get(url, function(data){word, app.gotVocabulario(word, data, selector, url, 0)}).fail(failcase_function);
	},
	
	gotVocabulario: function(word, data, selector, url, number){
		if(word != app.currentSearchword){
			return;
		}
		if(data.indexOf(">0 Resultate gefunden<") == -1 && data.indexOf("Resultate gefunden") != -1){
			$(selector).find('.statusimg').attr("src", "img/success.png");
			var dummydiv = $("<div>").html(data);
			var table_trs = $("#result_table tr", dummydiv.get(0));
			for (var i = 1; i < table_trs.length; i++) {
				var tds = $(table_trs[i]).find("td");
				var source = $(tds[0]).text();
				if($(tds[1]).text() != ""){
					source = source + " "+$(tds[1]).text();
				}
				var target = $(tds[2]).text();
				if($(tds[3]).text() != ""){
					target = target + " "+$(tds[3]).text();
				}
				$(selector).find('.list').append("<li>"+source+" → "+target+"</li>");
			}
			if(data.indexOf(">weiter</a>") != -1){
				number = number + 10;
				if(number < 100){ //we don't want to overload the server...
					var failcase_function = function(data){app.gotVocabulario(word, data.responseText, selector, url, number)};
					$.get(url+"&o="+number, function(data){app.gotVocabulario(word, data, selector, url, number)}).fail(failcase_function);
				}
			}
		}
		else{
			app.failedSelector(selector);
		}
	},
	
};

app.initialize();