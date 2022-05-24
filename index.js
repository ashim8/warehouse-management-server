const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

//middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: 'unauthorized access'})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
            return res.status(403).send({message: 'Forbidden access'});
        }
        req.decoded = decoded;
        next();
    })
   
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rnpem.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const furnitureCollection = client.db('warehouseProject').collection('product');
        const itemCollection = client.db('warehouseProject').collection('item');
        //for Auth
        app.post('/login', async(req, res)=>{
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{
                expiresIn: '1d'
            });
            res.send({accessToken});

        })
        //product api
        app.get('/product', async(req, res)=>{
            const query = {};
            const cursor = furnitureCollection.find(query);
            const products = await cursor.toArray();
            res.send(products)
        });
        app.get('/product/:id', async(req,res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const product = await furnitureCollection.findOne(query);
            res.send(product);
        })

        //POST
        app.post('/product', async(req,res)=>{
            const newProduct = req.body;
            const result = await furnitureCollection.insertOne(newProduct);
            res.send(result);
        });
         // put item
         app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            const quantityUpdate = req.body;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    quantity : quantityUpdate.quantity,
                }
            };
            const result = await furnitureCollection.updateOne(query, updateDoc, options);
            res.send(result);
        });

          //Delete
          app.delete('/product/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await furnitureCollection.deleteOne(query);
            res.send(result);
        })

        //order collection API

        app.get('/item', verifyJWT, async(req, res)=>{
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            // console.log(email);
            if(email === decodedEmail){
                const query = {email: email};
                const cursor = itemCollection.find(query);
                const items = await cursor.toArray();
                res.send(items);
            }
            else{
                res.status(403).send({message: 'forbidden access'})
            }
        })


        app.post('/item', async(req, res)=>{
            const item = req.body;
            const result = await itemCollection.insertOne(item);
            res.send(result);
        })

    }
    finally{
        
    }
}
run().catch(console.dir)

app.get('/', (req, res)=>{
    res.send('Runninggggggggggggg')
});
app.listen(port, () => {
    console.log('Running on port', port);
})