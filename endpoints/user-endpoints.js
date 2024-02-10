const { getPetByID, advSearch, changeStatus, addFavorite, deleteFavorite, getPetsByUser } = require('../services/db_services');
const express = require('express')
require('dotenv').config({ path: '../.env' });
const Ajv = require("ajv")

const app = express();
app.use(express.json());
const ajv = new Ajv();

//Search Pets link format: http://localhost:3001/pets/search?status=&type=&minHeight=50&maxHeight=60&minWeight=&maxWeight=&name=
app.get('/pets/search', async (req, res) => {
    //validation
    const searchTerms = {
        petStatus: req.query.status ? req.query.status : undefined,
        petType: req.query.type ? req.query.type : undefined,
        petName: req.query.name ? req.query.name : undefined,
        minHeight: req.query.minHeight ? parseInt(req.query.minHeight) : undefined,
        maxHeight: req.query.maxHeight ? parseInt(req.query.maxHeight) : undefined,
        minWeight: req.query.minWeight ? parseInt(req.query.minWeight) : undefined,
        maxWeight: req.query.maxWeight ? parseInt(req.query.maxWeight) : undefined
    };
    console.log(searchTerms);
    try {
        const searchResult = await advSearch(
            searchTerms.petStatus,
            searchTerms.petType,
            searchTerms.petName,
            searchTerms.minHeight,
            searchTerms.maxHeight,
            searchTerms.minWeight,
            searchTerms.maxWeight);
        console.log(searchResult);
        res.json(searchResult);
    } catch (err) {
        res.status('500').json({ error: 'Internal server error' });
    }
});

//add favorite
app.put('/pets/:id/save', async (req, res) => {
    const userID = 1; //get user by token
    const petID = parseInt(req.params.id);
    try {
        await addFavorite(userID, petID);
        res.status('200').json({ status: 'ok' });
    } catch (err) {
        res.status('500').json({ error: 'Internal server error' });
    }
})

//delete favorite
app.delete('/pets/:id/unsave', async (req, res) => {
    const userID = 1; //get user by token
    const petID = parseInt(req.params.id);
    try {
        await deleteFavorite(userID, petID);
        res.status('200').json({ status: 'ok' });
    } catch (err) {
        res.status('500').json({ error: 'Internal server error' });
    }
})



//change pet status
app.put('/pets/:id&:status/adopt', async (req, res) => {
    const userID = 1; //get user id by token
    const petID = parseInt(req.params.id);
    const newStatus = req.params.status;
    try {
        await changeStatus(newStatus, petID, userID);
        res.status('200').json({ status: 'ok' });
    } catch (err) {
        res.status('500').json({ error: 'Internal server error' });
    }
})

app.get('/pets/user/:id', async (req, res) => {
    const userID = req.params.id; //get user id by token 
    try {
        const userPets = await getPetsByUser(userID);
        res.json(userPets);
    } catch (err) {
        res.status('500').json({ error: 'Internal server error' });
    }
})

//Get Pet By ID
app.get('/pets/:id', async (req, res) => {
    const petID = req.params.id;
    try {
        const pet = await getPetByID(petID);
        res.json(pet[0]);
    } catch (err) {
        res.status('500').json({ error: 'Internal server error' });
    }
});


const PORT = process.env.APP_PORT;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
});