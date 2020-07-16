const Sauce = require('../models/Sauce');
const fs = require('fs');
const regexSauce = /^[a-z.!,'A-Z 0-9]*$/;

//Création d'une sauce
exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    if ((!regexSauce.test(sauceObject.name)) || (!regexSauce.test(sauceObject.manufacturer)) || (!regexSauce.test(sauceObject.description)) || (!regexSauce.test(sauceObject.mainPepper))) {
        res.status(400).json({ message: 'Format non valide' })
    } else {
    delete sauceObject._id;
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: []
    });
    sauce.save()
        .then(() => { res.status(201).json({ message: 'Sauce enregistrée !'}) })
        .catch(error => res.status(400).json({ error }));
}};

//Affichage des sauces
exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then((sauces) => { res.status(200).json(sauces) })
        .catch((error) => { res.status(500).json({ error: error }) });  
};

//Affichage de la sauce selectionnée
exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id : req.params.id }) 
        .then((sauce) => { 
            if(!sauce) {
                res.sendStatus(404)
                return 
            }
            res.status(200).json(sauce)
         })
        .catch((error) => { res.status(500).json({ error: error }) });
};

//Modification de la sauce
exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? { ...JSON.parse(req.body.sauce), imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`} : { ...req.body };
    if ((!regexSauce.test(sauceObject.name)) || (!regexSauce.test(sauceObject.manufacturer)) || (!regexSauce.test(sauceObject.description)) || (!regexSauce.test(sauceObject.mainPepper))){
        res.status(400).json({ message: 'Format non valide' })
    } else {
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
        .catch(error => res.status(404).json({ error: error }));
    }
};

//Suppression d'une sauce
exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Sauce supprimée !' }))
                .catch(error => res.status(400).json({ error }));
            });
        })
        .catch(error => res.status(500).json({ error }));
};

//Like/Dislike des sauces
exports.likeSauce = (req, res, next) => {
    switch (req.body.like) {
       //Liker une sauce
       case 1:
            Sauce.updateOne({ _id: req.params.id }, {
                    $inc: { likes: 1 },
                    $push: { usersLiked: req.body.userId },
                })
                .then(() => { res.status(200).json({ message: 'Sauce likée' }) })
                .catch((error) => { res.status(400).json({ error: error }) });
            break;
      
        //Disliker une sauce
        case -1:
            Sauce.updateOne({ _id: req.params.id }, {
                    $inc: { dislikes: 1 },
                    $push: { usersDisliked: req.body.userId },
                })
                .then(() => { res.status(200).json({ message: 'Sauce Dislikée'}) })
                .catch((error) => { res.status(400).json({ error: error }) });
            break; 
         
        //Retirer like
        case 0:
            Sauce.findOne({ _id: req.params.id })
                .then((sauce) => {
                    if (sauce.usersLiked.find(user => user === req.body.userId)) {
                        Sauce.updateOne({ _id: req.params.id }, {
                                $inc: { likes: -1 },
                                $pull: { usersLiked: req.body.userId },
                            })
                            .then(() => { res.status(200).json({ message: 'Like retiré' }) })
                            .catch((error) => { res.status(400).json({ error: error }) })
                    }
                
       //Retirer Dislike
                    if (sauce.usersDisliked.find(user => user === req.body.userId)) {
                        Sauce.updateOne({ _id: req.params.id }, {
                                $inc: { dislikes: -1 },
                                $pull: { usersDisliked: req.body.userId },
                            })
                            .then(() => { res.status(200).json({ message: 'Dislike retiré' }) })
                            .catch((error) => { res.status(400).json({ error: error }) })
                    }
                })
            break;
    }
};

