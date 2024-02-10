const mysql = require('mysql');
require('dotenv').config({ path: '../.env' });

const connection = mysql.createConnection({
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
    database: 'adoption_center'
});

connection.connect();

function execQuery(myQuery, ...params) {
    return new Promise((resolve, reject) => {
        const c = connection.query(myQuery, params, (err, results, fields) => {
            err ? reject(err) : resolve(JSON.parse(JSON.stringify(results)));
        })
    })
}

function getPetByID(id) {
    const query = `SELECT name, status_name, type_name, height, weight, color, bio, dietary, breed_name
        FROM Pets p 
        INNER JOIN Statuses s ON p.status_id  = s.status_id
        INNER JOIN Pet_types pt ON p.type_id = pt.type_id 
        INNER JOIN Breeds b ON p.breed_id = b.breed_id 
        WHERE p.pet_id = ?`;
    const pet = execQuery(query, id).catch((err) => {
        throw err.message
    })
    return pet;
}

function advSearch(
    petStatus = "status_name",
    petType = "type_name",
    petName = '',
    minHeight = 0,
    maxHeight = 999,
    minWeight = 0,
    maxWeight = 999) {

    const query = `SELECT name, status_name, type_name, height, weight, color, bio, dietary, breed_name
        FROM Pets p 
        INNER JOIN Statuses s ON p.status_id  = s.status_id
        INNER JOIN Pet_types pt ON p.type_id = pt.type_id 
        INNER JOIN Breeds b ON p.breed_id = b.breed_id 
        WHERE 
        status_name IN (SELECT status_name FROM Statuses s2 WHERE status_name = ?)
        AND 
        name LIKE '%${petName}%'
        AND
        type_name IN (SELECT type_name FROM Pet_types pt2 WHERE type_name = ?)
        AND
        height > ? AND height < ?
        AND 
        weight > ? AND weight < ?`

    const pets = execQuery(query, petStatus, petType, minHeight, maxHeight, minWeight, maxWeight).catch((err) => {
        throw err.message
    })
    return pets;
}

async function changeStatus(newStatus, petID, userID) {

    connection.beginTransaction((err) => {
        if (err) throw err;
    })
    const statusIDQuery = `SELECT status_id FROM Statuses WHERE status_name = ?`
    const newStatusID = await execQuery(statusIDQuery, newStatus).catch((err) => {
        throw err.message;
    });

    const currentStatusIDQuery = `SELECT status_id FROM Pets WHERE pet_id = ?`
    const currentStatusID = await execQuery(currentStatusIDQuery, petID).catch((err) => {
        throw err.message;
    });

    const updatePetsQuery = `UPDATE Pets
        SET status_id = ?, owner_id = ?
        WHERE pet_id = ?;`

    const updatePets = await execQuery(updatePetsQuery, newStatusID[0].status_id, userID, petID).catch((err) => {
        throw err.message;
    });

    const insertTransferQuery = `INSERT INTO Transfers(pet_id, initiator_id, new_status_id, prev_status_id, transfer_date)
        VALUES
        (?, ?, ?, ?, NOW());`

    const insertTransfer = await execQuery(insertTransferQuery, petID, userID, newStatusID[0].status_id, currentStatusID[0].status_id).catch((err) => {
        throw err.message;
    });

    connection.commit((err) => {
        if (err) {
            return connection.rollback(() => {
                throw err;
            });
        }
    });
    connection.end();
}

async function addFavorite(userID, petID) {
    const addFavQuery = `INSERT INTO Favorites (pet_id, owner_id) VALUES (?, ?)`;
    const addQuery = await execQuery(addFavQuery, petID, userID).catch((err) => {
        throw err.message;
    });
}

async function deleteFavorite(userID, petID) {
    const addFavQuery = `DELETE FROM Favorites WHERE pet_id = ? AND owner_id = ?`;
    const addQuery = await execQuery(addFavQuery, petID, userID).catch((err) => {
        throw err.message;
    });
}

async function getPetsByUser(userID) {
    const getPetsByStatusQuery = `SELECT DISTINCT  name, pet_id, mp.status_id, owner_id, link
    FROM (SELECT * FROM Pets p WHERE owner_id = ?) mp
    INNER JOIN 
    Statuses s ON mp.status_id = s.status_id
    INNER JOIN 
    Pictures pic USING (pet_id)`;

    const getPetsByStatus = await execQuery(getPetsByStatusQuery, userID).catch((err) => {
        throw err.message;
    });

    return getPetsByStatus;
}


async function test() {
    try {
        // const res = await getPetByID(4);
        // const pets = await advSearch(undefined,
        //     undefined,
        //     undefined,
        //     undefined,
        //     undefined,
        //     undefined,
        //     10);
        //await changeStatus('fostered', 1, 1);
        //await addFavorite(1, 5);
        //deleteFavorite(1, 5);
        //const a = await getPetsByUser(1);
        // console.log(pets.length);
    } catch (err) {
        console.log(err);
    }
}


test();

// connection.query('SELECT * FROM Pets', (err, rows, fields) => {
//     if (err) throw err
//     console.log(rows);
// })

// connection.end();
