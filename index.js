var express = require('express');

// El objeto app denomina convencionalmente la palicacion de express
var app = express();
var arxiveSingle=require("./arxivCrawlers/single.js");



//var info_basica = require ('./scrappers/sil_info_basica');

console.log("hola :)")

app.get('/', function(req, res) {
    res.end("***  Bienvenido a ORION  ***");
});
app.get('/arxive',function(req,res){
	arxiveSingle.single(req,res,function (){
		res.end("done");
	});
});
puerto=8000;
app.listen(puerto);

//test_neo();



console.log("ORION encendido en "+puerto);



