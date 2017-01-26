var crawler = require('crawler');
var url = require('url');
var fs = require('fs');
var async = require('async');

var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4j:1@localhost:7474');//http://localhost:7474');
module.exports = {
	single: function (req, res, finish){
		console.log("Arxive-Single");
		var autores={}
		var autoresCheck={}
		var articles={}
		var articlesCheck={}
		var temas={}
		var temasCheck={}
		var AA={};
		var c = new crawler({
          	forceUTF8:true,
			maxConnections : 100,
			userAgent:"ORION, propgrama para mapeo de datos científicos :), mail:gaburibe@gmail.com",
			callback : function (error, result) {
        		var $=result.$;
		    	var uri = result.options.uri;

		    	id=uri.split("Referencia=")[1];
		    	dip={};
		    	dip.uriid=id;
		    	articulos=[];
       			articulo={};
       			
		    	$('dd').each(function(index, elem) {
		    		articulo={};
		    		//temas=
		    		articulo.id=$("dl").find(".list-identifier").eq(index).find("a").attr("href");
		    		
		    		articulo.id=articulo.id.split("/")[2];
		    		articulo.title=$(elem).find(".list-title").contents(":not(span)").text();
		    		articles[articulo.id]={title:articulo.title,idarxiva:articulo.id};
		    		articles[articulo.id].authors={};
		    		$(elem).find(".list-authors").find("a").each(function(indexj, autorelem) {
		    			autor_href=$(autorelem).attr("href");
		    			idarxiv=autor_href.split("au:+")[1].split("/")[0];
		    			autores[idarxiv]=$(autorelem).text();
		    			articles[articulo.id].authors[idarxiv]={name:autores[idarxiv],idarxiv:idarxiv};
		    		});
		    		subjectText=$(elem).find(".list-subjects").text();
		    		subjectText.replace("Subjects:","");
		    		subjectText.replace("\n","");
		    		subjectsArr=subjectText.split(";");
		    		console.log("subject",subjectsArr);
		    		for(subjectind in subjectsArr){
		    			sub={}
		    			subjectst=subjectsArr[subjectind];
		    			console.log("subject",subjectst);
		    			if (subjectst) {
		    				sub.name=subjectst.split("(")[0];
			    			sub.idarxivt=subjectst.split("(")[1].replace(")","").replace("\n","");
			    			temas[sub.idarxivt]=sub;
		    			}
		    			
		    		}
		    		articles[articulo.id].temas=temas;
		    	});
		    	console.log("autores",autores);
		    	console.log("articulos",articlesCheck);
		    	console.log("temas",articles);
		    	async.each(articles, function(article, cb){
                   	if(articlesCheck[article.idarxiva]){
		    			console.log("repeated article");
		    		}
		    		else{
		    			console.log("adding article");
		    			addArticle(article,function(Dataresult){
		    				async.each(article.temas, function(tema, cbk){ //AÑADIR TEMAS
		    					addTheme(tema,function(Dataresultj){
				    				createSubject(article.idarxiva,tema.idarxivt,function(Dataresultk){
				    					cbk();
    								});
				    			});
		    				},function(errk){
		    					//cb();
			                 	console.log("se termino la importacion de temas");
			                });
		    				async.each(article.authors, function(author, cbj){ //AÑADIR AUTORES
		    							    		console.log(author,">>>");

		    						if(autoresCheck[author.idarxiv]){
		    							console.log("repetido",author)
		    							createAuthorship(author.idarxiv,article.idarxiva,function(Dataresultk){
		    								cbj();
		    							});
						    		}
						    		else{
						    			console.log("nuevo",author);
						    			autoresCheck[author.idarxiv]=author.name;
						    			addAuthor(author,function(Dataresultj){
						    				createAuthorship(author.idarxiv,article.idarxiva,function(Dataresultk){
						    					cbj();
		    								});
						    				
						    			});
						    		}
		    				},function(errj){
		    					cb();
			                 	console.log("se termino la importacion de autores");
			                });
		    			});
		    		}
               },function(err){
                 console.log("se termino la importacion de artículos");

               }); // insert Loop
			}	//CALLBACK CRAWLLER
        }); //CRAWLER
        searchArticles(function(dataA){
        	for(var nodea in dataA){
	        		articlei=dataA[nodea];
	        		console.log(articlei);
	        		articlesCheck[articlei["articulo.idarxiva"]]=articlei["articulo.title"];
	        	}
        	searchAuthors(function(data){
	        	for(var nodei in data){
	        		authori=data[nodei];
	        		console.log(authori);
	        		autoresCheck[authori["autor.idarxiv"]]=authori["autor.name"];
	        	}
	        	//console.log("a2:",autoresCheck)
	        	c.queue("https://arxiv.org/find/math/1/au:+Chaumont_L/0/1/0/all/0/1");
	        });
        });
        
        
	}
}
function createAuthorship(idaut,idart,done){
	console.log("MATCH (lft),(rgt) WHERE rgt.idarxiva IN ['"+idart+"'] AND lft.idarxiv IN ['"+idaut+"'] CREATE UNIQUE (lft)-[r:Authorship]->(rgt) RETURN r");
	db.cypher({
	    query: "MATCH (lft),(rgt) WHERE rgt.idarxiva IN ['"+idart+"'] AND lft.idarxiv IN ['"+idaut+"'] CREATE UNIQUE (lft)-[r:Authorship]->(rgt) RETURN r",
	    params: {
	        
	    },
	}, function (err, results) {
	    if (err) throw err;
	    console.log("link res",results);
	    done(results);
	});
}
function createSubject(idart,idsub,done){
	console.log("MATCH (lft),(rgt) WHERE rgt.idarxivt IN ['"+idart+"'] AND lft.idarxiv IN ['"+idsub+"'] CREATE UNIQUE (lft)-[r:Subject]->(rgt) RETURN r");
	db.cypher({
	    query: "MATCH (lft),(rgt) WHERE rgt.idarxivt IN ['"+idart+"'] AND lft.idarxiv IN ['"+idsub+"'] CREATE UNIQUE (lft)-[r:Subject]->(rgt) RETURN r",
	    params: {
	        
	    },
	}, function (err, results) {
	    if (err) throw err;
	    console.log("link res",results);
	    done(results);
	});
}
function addAuthor(author,done){
	db.cypher({
	    query: "CREATE (principal:Author { name:{name},idarxiv:{idarxiv} })",
	    params: {
	        name: author.name,
	        idarxiv:author.idarxiv
	    },
	}, function (err, results) {
	    if (err) throw err;
	    done(results);
	});
}
function addArticle(article,done){
	db.cypher({
	    query: "CREATE (art:Article { title:{title},idarxiva:{idarxiva} })",
	    params: {
	        title: article.title,
	        idarxiva:article.idarxiva
	    },
	}, function (err, results) {
	    if (err) throw err;
	    done(results);
	});
}
function addTheme(theme,done){
	db.cypher({
	    query: "CREATE (art:Theme { name:{name},idarxivt:{idarxivt} })",
	    params: {
	        name: theme.name,
	        idarxivt:theme.idarxivt
	    },
	}, function (err, results) {
	    if (err) throw err;
	    done(results);
	});
}
function searchAuthors(done){
	db.cypher({
	    query: "MATCH (autor:Author) RETURN autor.name, autor.idarxiv",
	    params: {
	    },
	}, function (err, results) {
	    if (err) throw err;	    
	    done(results);
	});
}
function searchArticles(done){
	db.cypher({
	    query: "MATCH (articulo:Article) RETURN articulo.title, articulo.idarxiva",
	    params: {
	    },
	}, function (err, results) {
	    if (err) throw err;	    
	    done(results);
	});
}
function searchThemes(done){
	db.cypher({
	    query: "MATCH (tema:Theme) RETURN tema.title, tema.idarxivt",
	    params: {
	    },
	}, function (err, results) {
	    if (err) throw err;	    
	    done(results);
	});
}
