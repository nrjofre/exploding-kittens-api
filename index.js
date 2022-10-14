const express = require('express');
const cors = require('cors');
const User = require('./config');
const app = express();

const PORT = (process.env.PORT || 8080)

app.use( express.json() );
app.use( cors() );

app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));


//get all users
app.get('/users', async(req, res) => {
    const snapshot = await User.get();
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));
    res.send({users: list});
});

//login
app.post('/login', async(req, res) => {
    const data = req.body;
    if (!data.email || !data.password){
        res.status(418).send({msg: "Need email and password"})
    }

    const email = data.email;
    const password = data.password;

    const snapshot = await User.get();
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    for (let i = 0; i < list.length; i++) {
        if (list[i].email == email && list[i].password == password){
            res.send({msg: "User Acepted"});   
        }
    }
    res.status(400).send({msg: "Email does not match password"})
});

//register user
app.post('/register', async(req, res) => {
    console.log("body");
    console.log(req.body);
    console.log("body");
    const data = req.body;

    await User.add(data);
    res.send({msg: "User Registered"});    
});

//update user
app.post('/update', async(req, res) => {
    const id = req.body.id;
    delete req.body.id;
    const data = req.body;
    await User.doc(id).update(data);
    res.send({msg: "User Updated"});    
});

//delete user
app.post('/delete', async(req, res) => {
    const id = req.body.id;
    await User.doc(id).delete();
    res.send({msg: "User Deleted"});    
});