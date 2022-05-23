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
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
    // console.log('inside verifyJWT',authHeader);
   
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
            console.log(id);
            const quantityUpdate = req.body;
            console.log(quantityUpdate);
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