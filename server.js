var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var validator = require('validator');
var crypto = require("crypto");
var os= require('os');

var cfenv = require('cfenv'); //cloud foundry for bluemix
var appEnv = cfenv.getAppEnv();

app.use(bodyParser.json({limit: '50mb'})); // support json encoded bodies
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // support encoded bodies

/*
* Cloudant
*/

// Load the Cloudant library.
var Cloudant = require('cloudant');

// Initialize Cloudant with settings from .env
var username = process.env.CLOUDANT_USERNAME;
var password = process.env.CLOUDANT_PASSWORD;
var cloudant = Cloudant({account:username, password:password});
db = cloudant.db.use("aiopdb");


var nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
var gmailPassword = process.env.GMAIL_PASSWORD;
var transporter = nodemailer.createTransport('smtps://rattrapageAiop%40gmail.com:'+gmailPassword+'@smtp.gmail.com');


function addOperation(from, on, operationType, callback){
    /*
    From : userId of the user
    On: document created/updated/deleted
    operationType: creation/modification/suppression
    */
    
    db.get(from, function(err, user){
        var now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        var operation={
            from: user.firstname + " " + user.lastname,
            on: on,
            operationType: operationType,
            date: now,
            type: "operation"
        }

        db.insert(operation, function(err, data) {
            if(typeof callback == "function"){
                callback();
            }
        });
    });
}

function isAuthenticatedMiddleWare(req, res, next){
    /*
    MW pour vérifier qu'un utilisateur est connecté
    */
    if(req.get("token") == undefined){
        res.status(401).send("Authentification requise. Aucun header token n'a été soumis.");
        return;
    }
    else if(req.get("userId") == undefined){
        res.status(401).send("Authentification requise. Aucun header userId n'a été soumis.");
        return;
    }
    else{
        db.get(req.get("userId"), function(err, user) {
            var now = new Date();
            if(user == undefined || user.token != req.get("token") || user.token_expiration_date < now.getTime()){
                res.status(401).send("Authentification requise. Le token soumis n'est pas valide ou a expiré");
                return;
            }
            else{
                next();
            }
        });
    }
}

function isAdminMiddleWare(req, res, next){
    /*
    MW pour vérifier qu'un utilisateur est admin
    */
        if(req.get("token") == undefined){
            res.status(401).send("Authentification requise. Aucun header token n'a été soumis.");
            return;
        }
        else if(req.get("userId") == undefined){
            res.status(401).send("Authentification requise. Aucun header userId n'a été soumis.");
            return;
        }
        else{
            db.get(req.get("userId"), function(err, user) {
                var now = new Date();
                if(user == undefined || user.token != req.get("token") || user.token_expiration_date < now.getTime()){
                    res.status(401).send("Authentification requise. Le token soumis n'est pas valide ou a expiré");
                    return;
                }
                else if (!user.isAdmin){
                    console.log(user);
                    res.status(401).send("Fonctionnalité réservée aux admin");
                    return;
                }
                else{
                    next();
                }
            });
        }
}

app.post('/api/resetPassword', function(req, res){
    /*
    Envoie un mail avec un lien pour changer son mdp
    */
    if(req.body.email == undefined){
        res.status(400).send("Une adresse mail est nécessaire");
        return;
    }
    else{
        db.find({selector:{type:'user', email: req.body.email}}, function(er, result) {
            if(result == undefined || result.docs.length == 0){
                res.status(200).send("Un email a été envoyé à "+req.body.email+" avec un lien permettant de changer votre mot de passe. Le lien est valide 2 heures.");
                return;
            }
            else{
                var tokenNotStringified = crypto.randomBytes(256); //prepare new token
                var token= tokenNotStringified.toString('hex');
                        
                var now = new Date();
                var token_expiration_date = now.getTime() + 7200000; // token expiration date = now + 2 hours

                result.docs[0].resetPasswordToken = token;
                result.docs[0].resetPasswordTokenExpiration = token_expiration_date;
                db.insert(result.docs[0], function(err, data) { //update user with token
                    // setup e-mail data
                    var mailOptions = {
                        from: '"Rattrapage AIOP" <rattrapageAiop@gmail.com>', // sender address
                        to: req.body.email, // list of receivers
                        subject: 'Changement de mot de passe', // Subject line
                        text: 'Pour changer votre mot de passe, veuillez vous rendre à l\'url suivante: https://aiop.eu-gb.mybluemix.net/#/resetPassword/'+token+'. Ce lien est valide 2 heures.' // plaintext body
                    };

                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, function(error, info){
                        if(error){
                            return console.log(error);
                        }
                        res.status(200).send("Un email a été envoyé à "+req.body.email+" avec un lien permettant de changer votre mot de passe. Le lien est valide 2 heures.");
                        return;
                    });
                });
            }
        });
    }
});

app.post('/api/resetPassword/:resetToken', function(req, res){
    /*
    Permet de changer le mot de passe de l'utilisateur avec resetPasswordToken = :resetToken
    input: un mot de passe
    */
    if(req.body.password == undefined || req.body.password ==""){
        res.status(400).send("Un mot de passe est obligatoire");
        return;
    }
    else{
        db.find({selector:{type:'user', resetPasswordToken: req.params.resetToken}}, function(er, result) {
            var now = new Date();
            var token_expiration_date = now.getTime();
            console.log(result.docs[0]);
            if(result == undefined || result.docs.length == 0 || result.docs[0].resetPasswordTokenExpiration < token_expiration_date){
                res.status(400).send("L'url ne correspond pas à un utilisateur ou a expiré");
                return;
            }
            else{
                result.docs[0].resetPasswordTokenExpiration = token_expiration_date;
                var hashedPassword = crypto.createHash('sha256').update(req.body.password).digest('base64');
                result.docs[0].password = hashedPassword;
                db.insert(result.docs[0], function(err, data) { //update user with token
                    res.status(200).send();
                });
            }
        });
    }
});

app.post('/api/login', function(req, res){
    /*
    Permet de logger, renvoie un token
    input: email, password
    */
    if(req.body.email == undefined || (!validator.isEmail(req.body.email) && req.body.email !="admin")){ //bad email
        res.status(400).send('Email non définit ou mal formé');
        return;
    }
    else if (req.body.password == undefined || req.body.password == ""){
        res.status(400).send('Le mot de passe est obligatoire');
        return;
    }

    db.find({selector:{type:'user', email: req.body.email}}, function(er, result) {
        if(result == undefined || result.docs.length == 0){
            res.status(400).send("Email ou mot de passe incorrect");
            return;
        }
        else{
            //crypt password
            var hashedPassword = crypto.createHash('sha256').update(req.body.password).digest('base64');
            if(result.docs[0].password != hashedPassword){
                res.status(400).send("Email ou mot de passe incorrect");
                return;
            }
            else{//creation et stockage du token
                var tokenNotStringified = crypto.randomBytes(256); //prepare new token
                var token= tokenNotStringified.toString('hex');
						
                var now = new Date();
                var token_expiration_date = now.getTime() + 7200000; // token expiration date = now + 2 hours

                result.docs[0].token = token;
                result.docs[0].token_expiration_date = token_expiration_date;
                db.insert(result.docs[0], function(err, data) { //update user with token
                    res.status(200).send({userId: result.docs[0]._id, token: result.docs[0].token, firstname: result.docs[0].firstname, lastname: result.docs[0].lastname, isAdmin: result.docs[0].isAdmin});
                    return;
                });
            }
        }
    });
});

app.post('/api/logout', function(req, res){
    /*
    Révoke le token de l'utilisateur (passé en header)
    */
    if (req.body.userId == undefined || req.body.userId == ""){
        res.status(400).send("userId obligatoire");
        return;
    }
    else if (req.body.token == undefined || req.body.token == ""){
        res.status(400).send("token obligatoire");
        return;
    }

    db.get(req.body.userId, function(err, user) {
        var now = new Date();
        if(user == undefined || user.token != req.body.token || user.token_expiration_date < now.getTime()){
            res.status(401).send();
            return;
        }
        else{
            user.token_expiration_date = now.getTime(); //revoke token
            db.insert(user, function(err, data){
                res.status(200).send();
                return;
            })
        }
    });
});

app.post('/api/users', isAdminMiddleWare, function(req, res) {
    /*
    Créer un utilisateur
    */
    if(req.body.email == undefined || !validator.isEmail(req.body.email)){ //bad email
        res.status(400).send('Email non définit ou mal formé');
        return;
    }
    else if (req.body.password == undefined || req.body.password == ""){
        res.status(400).send('Le mot de passe est obligatoire');
        return;
    }
    else if (req.body.firstname == undefined || req.body.firstname == ""){
        res.status(400).send('Le prénom est obligatoire');
        return;
    }
    else if (req.body.lastname == undefined || req.body.lastname == ""){
        res.status(400).send('Le nom de famille est obligatoire');
        return;
    }

    db.find({selector:{type:'user', email: req.body.email}}, function(er, result) { //check if mail is already used
        if(result != undefined && result.docs.length != 0){
            res.status(400).send("Adresse mail déjà utilisée");
            return;
        }
        else{
            //crypt password
            var hashedPassword = crypto.createHash('sha256').update(req.body.password).digest('base64');
            db.insert({type: "user", email: req.body.email, password: hashedPassword, firstname: req.body.firstname, lastname: req.body.lastname, isAdmin: false}, function(err, data) {
                if(err){
                    res.status(400).send(err);
                    return;
                }
                else{
                    res.status(201).send();
                    return;
                }
            });
        }
    });

});

app.get('/api/users', isAdminMiddleWare, function(req, res) {
    /*
    Renvoie la liste des utilisateurs authentifiés existant
    */
    db.find({selector:{type:'user'}}, function(er, result) {
        var users = [];

        if(result != undefined){
            result.docs.forEach(function(element, index, array){
                users.push({id: element._id, email: element.email, firstname: element.firstname, lastname: element.lastname});
            });
        }
        res.send(users);
    });
});

app.put('/api/users/self', isAuthenticatedMiddleWare,  function(req, res) { //to do later
    /*
    Modifie un utilisateur. Ne permet de modifier que le profil correspondant au token passé en header
    */
    if(req.body.email == undefined || !validator.isEmail(req.body.email)){ //bad email
        res.status(400).send('Email non définit ou mal formé');
        return;
    }
    else if (req.body.firstname == undefined || req.body.firstname == ""){
        res.status(400).send('Le prénom est obligatoire');
        return;
    }
    else if (req.body.lastname == undefined || req.body.lastname == ""){
        res.status(400).send('Le nom de famille est obligatoire');
        return;
    }
    db.get(req.get("userId"), function(err, user) {
        var now = new Date();
        if(user == undefined || req.get("token") == undefined || req.get("token") == "" || user.token != req.get("token") || user.token_expiration_date < now.getTime()){
            res.status(401).send("Authentification requise. Le token soumis n'est pas valide ou a expiré");
            return;
        }
        else{
            user.firstname = req.body.firstname;
            user.lastname = req.body.lastname;
            user.email = req.body.email;
            db.insert(user, function(err, data) {
                res.status(200).send();
            });
        }
    });
});

app.put('/api/users/:userId/asAdmin', isAdminMiddleWare, function(req, res) { //to do later
    /*
    Permet a un admin de modifier n'importe quel utilisateur
    */
    if(req.body.email == undefined || !validator.isEmail(req.body.email)){ //bad email
        res.status(400).send('Email non définit ou mal formé');
        return;
    }
    else if (req.body.firstname == undefined || req.body.firstname == ""){
        res.status(400).send('Le prénom est obligatoire');
        return;
    }
    else if (req.body.lastname == undefined || req.body.lastname == ""){
        res.status(400).send('Le nom de famille est obligatoire');
        return;
    }
    db.get(req.params.userId, function(err, user) {
        if(user == undefined){
            res.status(400).send("Utilisateur inexistant");
            return;
        }
        if(user.type != "user"){
            res.status(400).send("Cet objet n'est pas un utilisateur");
            return;
        }
        else{
            user.firstname = req.body.firstname;
            user.lastname = req.body.lastname;
            user.email = req.body.email;
            db.insert(user, function(err, data) {
                res.status(200).send();
            });
        }
    });
});


app.delete('/api/users/:id', isAdminMiddleWare, function(req, res) {
    /*
    Supprime un utilisateur
    */
    db.get(req.params.id, function(err, user){
        if(user == undefined){
            res.status(400).send("Utilisateur non existant");
            return;
        }
        else if (user.type != "user"){
            res.status(400).send("Utilisateur non existant");
            return;
        }
        else{
            db.destroy(user._id, user._rev, function(err, data) {
                res.status(200).send();
                return;
            });
        }

    });

});

app.post('/api/modules', isAdminMiddleWare, function(req, res){
    /*
    créer un module
    */
    if(req.body.moduleName == undefined || req.body.moduleName == ""){ // no name
        res.status(400).send('Le module doit avoir un nom');
        return;
    }
    var defaultImg = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBoZWlnaHQ9IjMwMHB4IiB3aWR0aD0iMzAwcHgiIHZlcnNpb249IjEuMCIgdmlld0JveD0iLTMwMCAtMzAwIDYwMCA2MDAiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8Y2lyY2xlIHN0cm9rZT0iI0FBQSIgc3Ryb2tlLXdpZHRoPSIxMCIgcj0iMjgwIiBmaWxsPSIjRkZGIi8+Cjx0ZXh0IHN0eWxlPSJsZXR0ZXItc3BhY2luZzoxO3RleHQtYW5jaG9yOm1pZGRsZTt0ZXh0LWFsaWduOmNlbnRlcjtzdHJva2Utb3BhY2l0eTouNTtzdHJva2U6IzAwMDtzdHJva2Utd2lkdGg6MjtmaWxsOiM0NDQ7Zm9udC1zaXplOjM2MHB4O2ZvbnQtZmFtaWx5OkJpdHN0cmVhbSBWZXJhIFNhbnMsTGliZXJhdGlvbiBTYW5zLCBBcmlhbCwgc2Fucy1zZXJpZjtsaW5lLWhlaWdodDoxMjUlO3dyaXRpbmctbW9kZTpsci10YjsiIHRyYW5zZm9ybT0ic2NhbGUoLjIpIj4KPHRzcGFuIHk9Ii00MCIgeD0iOCI+Tk8gSU1BR0U8L3RzcGFuPgo8dHNwYW4geT0iNDAwIiB4PSI4Ij5BVkFJTEFCTEU8L3RzcGFuPgo8L3RleHQ+Cjwvc3ZnPg=="
    var moduleImg = (req.body.moduleImg != undefined) ? req.body.moduleImg : defaultImg;
    
    db.insert({type: "module", moduleName: req.body.moduleName, moduleImg: moduleImg}, function(err, data) {
        if(err){
            res.status(400).send(err);
            return;
        }
        else{
            addOperation(req.get("userId"), "module: "+req.body.moduleName, "Ajout", function(){
                res.status(201).send();
                return;
            });
        }
    });
});

app.put('/api/modules/:moduleId', isAdminMiddleWare, function(req, res) { 
    /*
    Modifie un module
    */
    if(req.body.moduleName == undefined || req.body.moduleName == ""){ // no name
        res.status(400).send('Le module doit avoir un nom');
        return;
    }

    db.get(req.params.moduleId, function(err, module){
        if(module == undefined){
            res.status(400).send('module inexistant');
            return;
        }
        else if(module.type != "module"){
            res.status(400).send("l'object n'est pas un module");
            return;
        }
        else{
            module.moduleName = req.body.moduleName;
            if(req.body.moduleImg != undefined){
                module.moduleImg = req.body.moduleImg;
            }
            db.insert(module, function(err, data) {
                addOperation(req.get("userId"), "module: "+module.moduleName, "Modification", function(){
                    res.status(200).send();
                    return;
                });
            });
        }
    });
});

app.put('/api/modules/:moduleId/img', isAuthenticatedMiddleWare, function(req, res) {
    /*
    Modifie l'image d'un module
    */
    db.get(req.params.moduleId, function(err, module){
        if(module == undefined){
            res.status(400).send('module inexistant');
            return;
        }
        else if(module.type != "module"){
            res.status(400).send("l'object n'est pas un module");
            return;
        }
        else{
            if(req.body.moduleImg != undefined){
                module.moduleImg = req.body.moduleImg;
            }
            db.insert(module, function(err, data) {
                addOperation(req.get("userId"), "module: "+module.moduleName, "Modification", function(){
                    res.status(200).send();
                    return;
                });
            });
        }
    });
});

app.get('/api/modules', function(req, res){
    /*
    Renvoie la liste des modules
    */
    db.find({selector:{type:'module'}}, function(er, result) {
        var modules= []
        if(result != undefined){
            result.docs.forEach(function(element, index, array){
                modules.push({id: element._id, moduleName: element.moduleName, moduleImg: element.moduleImg});
            });
        }
        res.send(modules);
    });
});

app.delete('/api/modules/:moduleId', isAdminMiddleWare, function(req, res){
     /*
   Supprime un module
    */
    db.get(req.params.moduleId, function(err, module){
        if(module == undefined){
            res.status(400).send("module non existant");
            return;
        }
        else if(module.type != "module"){
            res.status(400).send("Cet objet n'est pas un module");
            return;
        }
        else{
            var deleteDocumentsIsDone = false;;
            var deleteModuleIsDone = false;
            db.find({selector:{type:'document', belongsToModule: module._id}}, function(er, result){
                if(result.docs.length == 0){
                    deleteDocumentsIsDone = true;
                }
                for(var i=0; i< result.docs.length; i++){
                    db.destroy(result.docs[i]._id, result.docs[i]._rev, function(err, data){
                        if(i == (result.docs.length)){
                            deleteDocumentsIsDone = true;
                        }
                        if(deleteModuleIsDone && deleteDocumentsIsDone){
                            addOperation(req.get("userId"), "module: "+module, "Suppression", function(){
                                res.status(200).send();
                                return;
                            });
                        }
                    });
                }
                db.destroy(module._id, module._rev, function(err, data) {
                    deleteModuleIsDone = true;
                    if(deleteDocumentsIsDone){
                        addOperation(req.get("userId"), "module: "+module.moduleName, "Suppression", function(){
                            res.status(200).send();
                            return;
                        });
                    }
                });
            });
        }

    });
});

app.post('/api/modules/:moduleId/documents', isAuthenticatedMiddleWare, function(req, res){
     /*
   Créer un document dans un module
    */
    db.get(req.params.moduleId, function(err, module){
        if(module == undefined){
            res.status(400).send("module non existant");
            return;
        }
        else if(module.type != "module"){
            res.status(400).send("Cet objet n'est pas un module");
            return;
        }
        else{
            if(req.body.documentName == undefined){
                res.status(400).send("Le nom du document doit être spécifié");
                return;
            }
            else if (req.body.documentType == undefined){
                res.status(400).send("Le type du document doit être spécifié");
                return;
            }
            else if (req.body.file == undefined){
                res.status(400).send("Le fichier doit être envoyé");
                return;
            }
            else if(req.body.fileType == undefined){
                res.status(400).send("Le type du fichier doit être envoyé");
                return;
            }
            else{
                var now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                db.get(req.get("userId"), function(err, user){
                    if(user != undefined){
                        db.insert({type: "document", documentName: req.body.documentName, documentType: req.body.documentType, file: req.body.file, fileType: req.body.fileType, belongsToModule: req.params.moduleId, lastModified: now, lastModifiedBy: user.firstname + " " + user.lastname}, function(err, data) {
                            if(err){
                                res.status(400).send(err);
                                return;
                            }
                            else{
                                addOperation(req.get("userId"), "document: "+req.body.documentName, "Ajout", function(){
                                    res.status(201).send();
                                    return;
                                });
                            }
                        });
                    }
                })
            }
        }
    });
});

app.get('/api/modules/:moduleId/documents', isAuthenticatedMiddleWare, function(req, res){
     /*
    Renvoie la liste des documents d'un module
    */
    db.get(req.params.moduleId, function(err, module){
        if(module == undefined){
            res.status(400).send("module non existant");
            return;
        }
        else if(module.type != "module"){
            res.status(400).send("Cet objet n'est pas un module");
            return;
        }
        else{
            db.find({selector:{type:'document', belongsToModule: req.params.moduleId}}, function(er, result) {
                var documents= []
                if(result != undefined){
                    result.docs.forEach(function(element, index, array){
                        documents.push({id: element._id, documentName: element.documentName, documentType: element.documentType, fileType: element.fileType, lastModified: element.lastModified, lastModifiedBy: element.lastModifiedBy});
                    });
                }
                res.send(documents);
            });
        }
    });
});

app.get('/api/modules/:moduleId/documents/public', function(req, res){
     /*
    Renvoie la liste des documents publics d'un module
    */
    db.get(req.params.moduleId, function(err, module){
        if(module == undefined){
            res.status(400).send("module non existant");
            return;
        }
        else if(module.type != "module"){
            res.status(400).send("Cet objet n'est pas un module");
            return;
        }
        else{
            db.find({selector:{type:'document', belongsToModule: req.params.moduleId, documentType:"public"}}, function(er, result) {
                var documents= []
                if(result != undefined){
                    result.docs.forEach(function(element, index, array){
                        documents.push({id: element._id, documentName: element.documentName, documentType: element.documentType, fileType: element.fileType, lastModified: element.lastModified, lastModifiedBy: element.lastModifiedBy});
                    });
                }
                res.send(documents);
            });
        }
    });
});

app.get('/api/documents/:documentId', isAuthenticatedMiddleWare, function(req, res){
     /*
    Renvoie un document et son contenu
    */
    db.get(req.params.documentId, function(err, document){
        if(document == undefined){
            res.status(400).send("document non existant");
            return;
        }
        else if(document.type != 'document'){
            res.status(400).send("Ce n'est pas un document")
            return;
        }
        else{
            res.send(document);
        }
    });
});

app.get('/api/documents/:documentId/public', function(req, res){
     /*
    Renvoie un document public et son contenu
    */
    db.get(req.params.documentId, function(err, document){
        if(document == undefined){
            res.status(400).send("document non existant");
            return;
        }
        else if(document.type != 'document'){
            res.status(400).send("Ce n'est pas un document")
            return;
        }
        else if(document.documentType != "public"){
            res.status(401).send("Ce document est privé")
            return;
        }
        else{
            res.send(document);
        }
    });
});

app.put('/api/documents/:documentId', isAuthenticatedMiddleWare, function(req, res){
    /*
    Modifie un document
    */
    db.get(req.params.documentId, function(err, document){
        if(document == undefined){
            res.status(400).send("document non existant");
            return;
        }
        else if(document.type != 'document'){
            res.status(400).send("Ce n'est pas un document");
            return;
        }
        else{
            if (req.body.documentType == undefined){
                res.status(400).send("Le type du document doit être spécifié");
                return;
            }
            else{
                document.documentType = req.body.documentType;
                if(req.body.file != undefined && req.body.fileType != undefined && req.body.documentName != undefined){
                    document.file = req.body.file;
                    document.fileType = req.body.fileType;
                    document.documentName = req.body.documentName;
                }
                document.lastModified = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                db.get(req.get("userId"), function(err, user){
                    if(user != undefined){
                        document.lastModifiedBy = user.firstname + " " + user.lastname;
                        db.insert(document, function(err, data) {
                            addOperation(req.get("userId"), "document: "+document.documentName, "Modification", function(){
                                res.status(200).send();
                                return;
                            });
                        });
                    }
                });
            }
        }
    });
});

app.delete('/api/documents/:documentId', isAuthenticatedMiddleWare, function(req, res){
    /*
    supprime un document
    */
    db.get(req.params.documentId, function(err, document){
        if(document == undefined){
            res.status(400).send("document non existant");
            return;
        }
        else if(document.type != 'document'){
            res.status(400).send("Ce n'est pas un document");
            return;
        }
        else{
            db.destroy(document._id, document._rev, function(err, data) {
                addOperation(req.get("userId"), "document: "+document.documentName, "Suppression", function(){
                    res.status(200).send();
                    return;
                });
            });
        }
    });
});

app.get('/api/operations', isAuthenticatedMiddleWare, function(req, res){
    /*
    Renvoie la liste des opérations
    */
    db.find({selector:{type:"operation"}}, function(err, result){
        res.send(result.docs);
    });
});

 
//client
app.use(express.static(__dirname + '/public'));
app.get('*', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

app.listen(appEnv.port, '0.0.0.0', function () {
  console.log('Example app listening on port 3000!');
});