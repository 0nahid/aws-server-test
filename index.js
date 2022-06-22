const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();
const jwt = require('jsonwebtoken');
// middleware
app.use(cors());
app.use(express.json());

// verify jwt token
// app.use(async (req, res, next) => {
//     const token = req.headers['authorization'];
//     if (token) {
//         try {
//             const decoded = await jwt.verify(token, process.env.JWT_SECRET);
//             req.user = decoded;
//             next();
//         } catch (err) {
//             res.status(401).send({ error: 'Invalid token' });
//         }
//     } else {
//         res.status(401).send({ error: 'No token' });
//     }
// });

// function verifyJWT(req, res, next) {
//     const authToken = req.headers.authorization;
//     if (!authToken) {
//         res.status(401).send({ error: 'No token' });
//     }
//     const token = authToken.split(' ')[1];
//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRECT, (err, decoded) => {
//         if (err) {
//             res.status(403).send({ error: 'Forbidden access token' });
//         }
//         console.log(decoded);
//     })
//     next();
// }

function jwtCheck(req, res, next) {
    const authToken = req.headers.authorization;
    if (!authToken) {
        res.status(401).send({ error: 'Unauthorized access' });
    }
    const token = authToken.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRECT, (err, decoded) => {
        if (err) {
            res.status(403).send({ error: 'Forbidden access token' });
        }
        // console.log(`decoded`, decoded);
        req.decoded = decoded;
        next();
    })
    
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@genius.r5hwg.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('Machanics').collection('services');
        const orderCollection = client.db('Machanics').collection('orders');
        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        // POST
        app.post('/service', async (req, res) => {
            const newService = req.body;
            const result = await serviceCollection.insertOne(newService);
            res.send(result);
        });

        // DELETE
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        });

        //  order post api
        app.post('/order', async (req, res) => {
            const newOrder = req.body;
            const result = await orderCollection.insertOne(newOrder);
            res.send(result);
        });
        // get the order 
        app.get('/order', jwtCheck, async (req, res) => {
            const decodedEmail = req?.decoded?.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            }
            else {
                res.status(401).send({ error: 'Unauthorized access' });
            }
        })


        // AUTH
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRECT, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })

    }
    finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Running Genius Server');
});

app.listen(port, () => {
    console.log('Listening to port', port);
})

