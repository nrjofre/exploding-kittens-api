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
const AvailableMatch = db.collection('AvailableMatches')
const MatchInvite = db.collection('MatchInvites')
const Card = db.collection('Cards')

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
    //console.log(req.params);
    const { username } = req.params;
    const snapshot = await User.get();
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    var friends;
    for (let i = 0; i < list.length; i++) {
        if (list[i].username == username){
            friends = list[i].friends;
        }
    }
    console.log(friends)
    if (friends == null){
        return res.status(418).send({msg: "User does not exist"});
    }
    else if(friends.length == 0){
        var notfriends = list
        for (let i = 0; i < notfriends.length; i++) {
            if (notfriends[i].username == username){
                notfriends.splice(i,1)
            }
        }
        return res.send(notfriends);
    }

    var list2 = [];
    for (let i = 0; i < list.length; i++) {
        if (list[i].username == username){
            continue;
        }

        if (friends.includes(list[i].id)){
            continue;
        }
        else{
            var friend = list[i];
            list2.push(friend)
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
//create friend invite
app.post('/finvite', async(req, res) => {
    console.log(req.body);
    const invitor = req.body.invitor;
    const invited = req.body.invited;
    const data = {invited: invited, invitor: invitor}

    await FriendInvite.add(data);

    return res.send({msg: "Friend Invite Created"});   
});

//accept friend invite
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

//reject friend invite
app.post('/deletefinvite', async(req, res) => {
    console.log(req.body);
    const id = req.body.id;
    await FriendInvite.doc(id).delete();
    return res.send({msg: "Invite Rejected"});      
});

//get friend invites
app.get('/finvite/:username', async(req, res) => {
    console.log(req.params);
    const { username } = req.params;
    const snapshot = await FriendInvite.get();
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    var invites = [];
    for (let i = 0; i < list.length; i++) {
        if (list[i].invited == username){
            invites.push(list[i]);
        }
    }
    return res.send(invites);
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//create match
app.post('/creatematch', async(req, res) => {
    console.log(req.body);
    const gamename = req.body.gamename
    const creator = req.body.creator;
    const settings = req.body.settings;
    const participants = req.body.participants;
    const lastcard = ""
    const turn = 0

    const data = {gamename: gamename,creator: creator, participants: participants, settings: settings, lastcard, turn}
    await AvailableMatch.add(data);

    const snapshot = await User.get();
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    var uid;
    for (let i = 0; i < list.length; i++) {
        if (list[i].username == creator){
            uid = list[i].id; 
            break
        }
    }
    const datauser = {lastgame: gamename}

    await User.doc(uid).update(datauser);

    return res.send({msg: "Match Created"});
});

//create match invite
app.post('/minvite', async(req, res) => {
    console.log(req.body);
    const invitor = req.body.invitor;
    const invited = req.body.invited;
    const gamename = req.body.gamename;

    const snapshot = await AvailableMatch.get();
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    var matchid;

    for (let i = 0; i < list.length; i++) {
        if (list[i].gamename == gamename){
            matchid = list[i].id
            break
        }
    }


    const data = {matchid: matchid, gamename: gamename, invited: invited, invitor: invitor}

    await MatchInvite.add(data);

    return res.send({msg: "Match Invite Created"});   
});

//accept match invite
app.post('/acceptminvite', async(req, res) => {
    const id = req.body.id;
    console.log(id)
    delete req.body.id;

    const snapshot = await MatchInvite.get();
    const snapshot2 = await AvailableMatch.get();
    const snapshot3 = await User.get();
    
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));
    const list2 = snapshot2.docs.map((doc) => ({ id:doc.id, ...doc.data() }));
    const list3 = snapshot3.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    var id1;
    var matchid;
    var participants = [];
    var user;
    var gamename;

    for (let i = 0; i < list.length; i++) {
        if (list[i].id == id){
            matchid = list[i].matchid
            user = list[i].invited;

            for (let j = 0; j < list2.length; j++) {
                if (list2[j].id == matchid){
                    participants = list2[j].participants;
                    id1 = list2[j].id;
                    gamename = list2[j].gamename
                }
            }
        }
    }

    if (id1 == null){
        return res.status(418).send({msg: "Invalid Invite"}); 
    }

    participants.push(user)

    var uid;
    for (let i = 0; i < list3.length; i++) {
        if (list3[i].username == user){
            uid = list3[i].id; 
            break
        }
    }
    const datauser = {lastgame: gamename}
    await User.doc(uid).update(datauser);

    const data = {participants: participants}
    await AvailableMatch.doc(id1).update(data);

    await MatchInvite.doc(id).delete();

    return res.send({msg: "Match Request Accepted"});
});

//reject match invite
app.post('/deleteminvite', async(req, res) => {
    console.log(req.body);
    const id = req.body.id;
    await MatchInvite.doc(id).delete();
    return res.send({msg: "Match Invite Rejected"});      
});

//get match invites
app.get('/minvite/:username', async(req, res) => {
    console.log(req.params);
    const { username } = req.params;
    const snapshot = await MatchInvite.get();
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    var invites = [];
    for (let i = 0; i < list.length; i++) {
        if (list[i].invited == username){
            invites.push(list[i]);
        }
    }
    return res.send(invites);
});

//get my matches
app.get('/matches/:username', async(req, res) => {
    console.log(req.params);
    const { username } = req.params;
    const snapshot = await AvailableMatch.get();
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    var matches = [];
    for (let i = 0; i < list.length; i++) {
        for (let j = 0; j < list[i].participants.length; j++) {
            if (list[i].participants[j] == username){
                matches.push(list[i]);
            }
        }  
    }
    return res.send(matches);
});
//                           ENTREGA FINAL
//get user cards
app.get('/cards/:username', async(req, res) => {
    console.log(req.params);
    const { username } = req.params;
    const snapshot = await User.get();
    const snapshot2 = await Card.get();
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));
    const listc = snapshot2.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    var cards;
    for (let i = 0; i < list.length; i++) {
        if (list[i].username == username){
            cards = list[i].cards;
        }
    }
    if (cards == null){
        return res.status(418).send({msg: "No cards"});
    }

    var list2 = [];
    for (let i = 0; i < listc.length; i++) {
        for (let j = 0; j < cards.length; j++) {
            if (cards[j] == listc[i].id){
                var card = listc[i];
                list2.push(card)
            }
        }
    }
    return res.send(list2);
});

//get participants
app.post('/participants', async(req, res) => {
    console.log(req.body);
    const gamename = req.body.gamename;
    const username = req.body.username;

    const snapshot = await AvailableMatch.get();
    const snapshotu = await User.get();

    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));
    const listu = snapshotu.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    var match_participants = [];
    
    for (let i = 0; i < list.length; i++) {
        if (list[i].gamename == gamename){
            match_participants = list[i].participants;
        }
    }

    var list2 = [];
    for (let i=0; i < match_participants.length; i++) {
        if (match_participants[i] != username)  {
            list2.push(match_participants[i]) 
        }
    }
    var list3 = [];
    for (let i=0; i < listu.length; i++) {
        for (let j=0; j < list2.length; j++){
            if (list2[j] == listu[i].username)  {
                list3.push(listu[i]);
            }
        }
        
    }
    return res.send(list3);
});

//get draw
app.get('/draw/:username', async(req, res) => {
    console.log(req.params);
    const { username } = req.params;
    
    const snapshot = await User.get();
    const snapshot2 = await Card.get();
    const snapshot3 = await AvailableMatch.get();

    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));
    const listc = snapshot2.docs.map((doc) => ({ id:doc.id, ...doc.data() }));
    const list3 = snapshot3.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    var cards; // cartas que tiene el usuario
    var id;
    var gamename;

    for (let i = 0; i < list.length; i++) {
        if (list[i].username == username){
            cards = list[i].cards;
            id = list[i].id;
            gamename = list[i].lastgame
        }
    }
    if (cards == null){
        cards = [];
    }

    var list2 = []; // cartas posibles para robar
    for (let i = 0; i < listc.length; i++) {
        list2.push(listc[i].id);
    }
    const n = 4 // cantidad n de cartas existentes modificar si se agregan cartas

    var card;

    while (card == null){ // ese id es el id de la carta defuse, la carta defuse no se puede repartir
        var random = Math.floor(Math.random() * n);
        card = list2[random];
    }

    var defuse;
    var pos;
    for (let i = 0; i < cards.length; i++) {
        if (cards[i] ==  "5VYvZ4k72Y2fbfEmGdiV"){
            defuse = 1;
            pos = i
        }
    }
    var idgame;
    var participants;
    var pos2;

    if (card == "URntNGMaWx6ig4JDCdV7" && defuse == 1){
        cards.splice(pos,1)
        const data = {cards: cards}
        await User.doc(id).update(data);
        return res.send({msg: "Using Defuse"});
    }
    else if ((card == "URntNGMaWx6ig4JDCdV7" && defuse == null)){
        for (let i = 0; i < list3.length; i++) {
            if (list3[i].gamename == gamename){
                idgame = list3[i].id;
                participants = list3[i].participants;
            }
        }

        for (let i = 0; i < participants.length; i++) {
            if (participants[i] == username){
                pos2 = i;
            }
        }

        participants.splice(pos2,1)
        const data1 = {participants: participants}
        await AvailableMatch.doc(idgame).update(data1);
        
        const data = {cards: cards, lastgame: ""}
        await User.doc(id).update(data);
        return res.send({msg: "Lose"});
    }

    cards.push(card)

    const data = {cards: cards}
    await User.doc(id).update(data);

    return res.send({msg: `user has drawn ${card}`});
});

//get draw
app.get('/drawgame/:gamename', async(req, res) => {
    console.log(req.params);
    const { gamename } = req.params;
    const snapshot = await AvailableMatch.get();
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    var turn;
    var id;
    for (let i = 0; i < list.length; i++) {
        if (list[i].gamename == gamename){
            turn = list[i].turn;
            id = list[i].id
        }
    }
    turn += 1;

    const data = {turn: turn}
    await AvailableMatch.doc(id).update(data);

    return res.send({msg: "next turn"});
});

//get draw5
app.get('/draw5/:username', async(req, res) => {
    console.log(req.params);
    const { username } = req.params;
    const snapshot = await User.get();
    const snapshot2 = await Card.get();
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));
    const listc = snapshot2.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    var cards = []; // cartas que tiene el usuario
    var id;
    for (let i = 0; i < list.length; i++) {
        if (list[i].username == username){
            id = list[i].id;
        }
    }
    var list2 = []; // cartas posibles para robar
    for (let i = 0; i < listc.length; i++) {
        list2.push(listc[i].id);
    }
    const n = 4 // cantidad n de cartas existentes modificar si se agregan cartas

    var card;
    for (let i = 0; i < 4;i++) {
        while (card == null || card == "URntNGMaWx6ig4JDCdV7" || card == "5VYvZ4k72Y2fbfEmGdiV" ){ // ese id es el id de la carta defuse, la carta defuse no se puede repartir
            var random = Math.floor(Math.random() * n);
            card = list2[random];
        }
        cards.push(card)
        card = null;
    }

    cards.push("5VYvZ4k72Y2fbfEmGdiV")

    const data = {cards: cards}
    await User.doc(id).update(data);
    return res.send({msg: `${username} has drawn 5 cards`});
});

//post playcard
app.post('/playcard', async(req, res) => {
    console.log(req.body);
    const username  = req.body.username;
    const played_card = req.body.played_card;
    const gamename = req.body.gamename;
    
    const snapshot = await User.get();
    const snapshot2 = await AvailableMatch.get();
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));
    const list2 = snapshot2.docs.map((doc) => ({ id:doc.id, ...doc.data() }));
    const list3 = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    var cards; // cartas que tiene el usuario
    var id;
    var id2;
    var id3;
    var spliced;
    var idefuses;
    
    for (let i = 0; i < list.length; i++) {
        if (list[i].username == username){
            cards = list[i].cards;
            id = list[i].id;
        }
    }

    for (let i = 0; i < cards.length; i++) {
        if (cards[i] == played_card) {
            spliced = cards.splice(i,1);
            break;
        }
    }

    for (let i = 0; i < list2.length; i++) {
        if (list2[i].gamename == gamename){
            id2 = list2[i].id;
        }
    }

    
        //actualizar usuario
    for (let i = 0; i < list3.length; i++) {
        if (list3[i].username == username){
            id3 = list3[i].id;
            idefuses = list3[i].defuses;
            console.log(defuses)
        }
    }

    if (played_card == "5VYvZ4k72Y2fbfEmGdiV"){
        //actualizar usuario
        idefuses += 1;   
    }
    
    const data_defuses = {defuses: idefuses}
    const data = {cards: cards}
    const data2 = {lastcard: played_card}
    await User.doc(id3).update(data_defuses)
    await User.doc(id).update(data);
    await AvailableMatch.doc(id2).update(data2);
    return res.send({msg: `${username} played a ${played_card} card`});
});

//get a user
app.get('/users/:username', async(req, res) => {
    const {username} = req.params
    const snapshot = await User.get();
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));
    var selected_user;

    for (let i = 0; i < list.length; i++) {
        if (list[i].username == username){
            selected_user = list[i];
        }
    }
    return res.send(selected_user);
});

//get player turn index
app.post('/myturn', async(req, res) => {
    console.log(req.body);
    const gamename = req.body.gamename;
    const username = req.body.username;

    const snapshot = await AvailableMatch.get();
    const list = snapshot.docs.map((doc) => ({ id:doc.id, ...doc.data() }));

    var match_participants = [];
    var index;

    for (let i = 0; i < list.length; i++) {
        if (list[i].gamename == gamename){
            match_participants = list[i].participants;
        }
    }

    for (let i=0; i < match_participants.length; i++) {
        if (match_participants[i] == username)  {
            index = i; 
        }
    }

    if (index == null){
        return res.send({msg: "null"});
    }
    return res.send({msg: index});
});