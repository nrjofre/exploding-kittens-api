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
    return res.send({users: list});
});

//get friends
app.get('/friends/:username', async(req, res) => {
    console.log(req.params);
    const { username } = req.params;
    const snapshot = await User.get();
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    for (let i = 0; i < list.length; i++) {
        if (list[i].username == username){
            const friends = list[i].friends
            return res.send({friends: friends});
        }
    }

    return res.send({msg: "User not found"});
});

//login
app.post('/login', async(req, res) => {
    const data = req.body;
    console.log(req.body);
    if (!data.username || !data.password){
        return res.status(418).send({msg: "Need username and password"});
    }

    const username = data.username;
    const password = data.password;

    const snapshot = await User.get();
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    for (let i = 0; i < list.length; i++) {
        if (list[i].username == username && list[i].password == password){
            return res.send({id: list[i].id, username: list[i].username});
        }
    }
    return res.status(400).send({msg: "Username and password do not match"});
});

//register user
app.post('/register', async(req, res) => {
    console.log(req.body);
    const data = req.body;

    await User.add(data);

    const username = data.username;
    const snapshot = await User.get();
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    for (let i = 0; i < list.length; i++) {
        if (list[i].username == username){
            return res.send(list[i]);
        }
    }  
});

//update user
app.post('/update', async(req, res) => {
    console.log(req.body);
    const id = req.body.id;
    delete req.body.id;
    const data = req.body;
    await User.doc(id).update(data);
    return res.send({msg: "User Updated"});    
});

//delete user
app.post('/delete', async(req, res) => {
    console.log(req.body);
    const id = req.body.id;
    await User.doc(id).delete();
    return res.send({msg: "User Deleted"});    
});