const express = require('express');
const User = require('./config');
const app = express();

const PORT = (process.env.PORT || 8080)

app.use( express.json() );

app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));


//get all users
app.get('/users', async(req, res) => {
    const snapshot = await User.get();
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));
    res.send(list);
});

//register user
app.post('/register', async(req, res) => {
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