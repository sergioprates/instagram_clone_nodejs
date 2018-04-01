var express = require('express');

var bodyParser = require('body-parser');
var multiParty = require('connect-multiparty');
var fs = require('fs');
var mongo = require('mongodb');
var objectId = mongo.ObjectId;
var app = express();

app.use(express.static('./temp'));


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(multiParty());
app.use(function(req, res, next){
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});

var port = 8080;

var db = new mongo.Db('instagram', 
new mongo.Server('localhost', 27017, {}), {});
app.listen(port, function(){
    console.log('Servidor escutando: ' + port);
});

app.get('/', function(req, res){
    res.send({msg: 'Olá'});
});

app.post('/api', function(req, res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    var dados = req.body;    
    var timestamp = new Date().getTime();
    var path_origem = req.files.arquivo.path;
    var url_imagem = timestamp + '_' + req.files.arquivo.name.toString();
    var path_destino = './temp/' + url_imagem;

    copy(path_origem, path_destino, function(ex){
        if (ex) {
            res.status(500).json({error: ex});
            return;
        }               
        db.open(function(ex, mongoclient){
            mongoclient.collection('postagens', function(ex, collection){
                collection.insert({url_imagem: url_imagem, titulo: req.body.titulo}, function(ex, result){
                    if(ex){
                        res.json(ex);
                    }else{
                        res.json(result);
                    }
                    mongoclient.close();
                });
            });
        });
    });
});

function copy(oldPath, newPath, callback) {
    var readStream = fs.createReadStream(oldPath);
    var writeStream = fs.createWriteStream(newPath);

    readStream.on('error', callback);
    writeStream.on('error', callback);

    readStream.on('close', function () {
        fs.unlink(oldPath, callback);
    });

    readStream.pipe(writeStream);
}


app.get('/api', function(req, res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    db.open(function(ex, mongoclient){
        mongoclient.collection('postagens', function(ex, collection){
            collection.find({}).toArray(function(ex, result){
                if(ex){
                    res.json(ex);
                }else{
                    res.json(result);
                }
                mongoclient.close();
            });
        });
    });
});

app.get('/api/:id', function(req, res){
    var id = req.params.id;
    db.open(function(ex, mongoclient){
        mongoclient.collection('postagens', function(ex, collection){
            collection.find(objectId(id)).toArray(function(ex, result){
                if(ex){
                    res.json(ex);
                }else{
                    res.json(result);
                }
                mongoclient.close();
            });
        });
    });
});

app.get('/imagens/:id', function(req, res){
    var img = req.params.id;

    fs.readFile('./temp/' + img, function(ex, content){
        if(ex){
            res.status(404).json(ex);
            return;
        }

        res.writeHead(200, {'Content-Type': 'image/jpg'});
        res.write(content);
        res.end();
    });
});

app.put('/api/:id', function(req, res){
    var id = req.params.id;
    var dadosForm = req.body;
    db.open(function(ex, mongoclient){
        mongoclient.collection('postagens', function(ex, collection){
            collection.update({_id: objectId(id)}, { $set: {titulo: dadosForm.titulo}}, {}, function(ex, result){
                if(ex){
                    res.json(ex);
                }else{
                    res.json(result);
                }
                mongoclient.close();
            });
        });
    });
});


app.delete('/api/:id', function(req, res){
    var id = req.params.id;
    var dadosForm = req.body;
    db.open(function(ex, mongoclient){
        mongoclient.collection('postagens', function(ex, collection){
            collection.remove({_id: objectId(id)}, function(ex, result){
                if(ex){
                    res.json(ex);
                }else{
                    res.status(200).json(result);
                }
                mongoclient.close();
            });
        });
    });
});