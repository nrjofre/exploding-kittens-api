const express = require('express');
const cors = require('cors');
const db = require('./config')

const app = express();

const PORT = (process.env.PORT || 8080)

app.use( express.json() );
app.use( cors() );

app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));

const User = db.collection('Users')
const FriendInvite = db.collection('FriendInvites')
const MatchInvite = db.collection('MatchInvites')

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

    var friends;
    for (let i = 0; i < list.length; i++) {
        if (list[i].username == username){
            friends = list[i].friends;
        }
    }
    if (friends == null){
        return res.status(418).send({msg: "No friends"});
    }

    var list2 = [];
    for (let i = 0; i < list.length; i++) {
        for (let j = 0; j < friends.length; j++) {
            if (friends[j] == list[i].id){
                var friend = list[i];
                list2.push(friend)
            }
        }
    }
    return res.send(list2);
});

//get not friends
app.get('/notfriends/:username', async(req, res) => {
    console.log(req.params);
    const { username } = req.params;
    const snapshot = await User.get();
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    var friends;
    for (let i = 0; i < list.length; i++) {
        if (list[i].username == username){
            friends = list[i].friends;
        }
    }
    if (friends == null){
        return res.status(418).send({msg: "User does not exist"});
    }
    else if(friends.length == 0){
        return res.send(list);
    }

    var list2 = [];
    for (let i = 0; i < list.length; i++) {
        for (let j = 0; j < friends.length; j++) {
            if (list[i].username == username){
                continue;
            }
            else if (friends[j] != list[i].id){
                var friend = list[i];
                list2.push(friend)
            }
        }
    }
    return res.send(list2);
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


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//create finvite
app.post('/finvite', async(req, res) => {
    console.log(req.body);
    const invitor = req.body.invitor;
    const invited = req.body.invited;
    const data = {invited: invited, invitor: invitor}

    await FriendInvite.add(data);

    return res.send({msg: "Friend Invite Created"});   
});

//accept finvite
app.post('/acceptfinvite', async(req, res) => {
    const id = req.body.id;
    delete req.body.id;

    const snapshot = await FriendInvite.get();
    const snapshot2 = await User.get();
    
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));
    const list2 = snapshot2.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    var friends1;
    var friends2;

    var id1;
    var id2;

    for (let i = 0; i < list.length; i++) {
        if (list[i].id == id){
            const user2 = list[i].invited;
            const user1 = list[i].invitor;

            for (let j = 0; j < list2.length; j++) {
                if (list2[j].username == user2){
                    friends2 = list2[j].friends;
                    id2 = list2[j].id;
                }
                else if(list2[j].username == user1){
                    friends1 = list2[j].friends;
                    id1 = list2[j].id;
                }
            }
        }
    }

    if (id1 == null || id2 == null){
        return res.status(418).send({msg: "Invalid Invite"}); 
    }

    friends1.push(id2);
    friends2.push(id1);

    const data1 = {friends: friends1}
    const data2 = {friends: friends2}

    await User.doc(id1).update(data1);
    await User.doc(id2).update(data2);

    await FriendInvite.doc(id).delete();

    return res.send({msg: "Friend Request Accepted"});
});

//reject finvite
app.post('/deletefinvite', async(req, res) => {
    console.log(req.body);
    const id = req.body.id;
    await FriendInvite.doc(id).delete();
    return res.send({msg: "Invite Rejected"});      
});