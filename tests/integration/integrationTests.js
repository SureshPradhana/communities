const request = require('supertest');
const app = require('../../server'); 
const expect = require('chai').expect;
const { connectToMongo, rolesCollection,usersCollection,communitiesCollection } = require('../../src/database/mongo');

let token="";
let communityid="";
let roleid="";
let userid="";

//roles integration tests
describe('a suite role integration tests', function () {

  this.timeout(10000);

  before(async function() {
    await connectToMongo();
    await rolesCollection.deleteOne({name: 'Test Role 8'});
  });

  it('1 should create a new role',function(done) {
      const roleData = { name: 'Test Role 8' };
      request(app)
        .post('/v1/role')
        .send(roleData)
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          expect(res.body.status).to.be.true;
          roleid=res.body.content.data.id;
          done();
        });

    });

  it('2 should get roles', function (done) {
    request(app)
        .get('/v1/role')
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          expect(res.body.status).to.be.true;
          done();
        });
  });
  
});

//auth integration tests
describe('a suite auth integration tests', function () {
  
  this.timeout(10000);

  before(async function() {
    await connectToMongo();
  });
  
  it('1 should create a new user using signup',function(done) {
      const userData = { name: 'test user' ,email:"test@gmail.com",password : '12354545998788349923'};
      request(app)
        .post('/v1/auth/signup')
        .send(userData)
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          expect(res.body.status).to.be.true;
          done();
        });
    });
  
  it('2 should throw error on existing user',function(done) {
    const userData = { name: 'test user' ,email:"test@gmail.com",password : '12354545998788349923'};
    request(app)
      .post('/v1/auth/signup')
      .send(userData)
      .expect(400)
      .end(function(err, res) {
        expect(res.body.message).to.be.equal("Email already in use");
        done();
      });
  });
  

  it('3 should signin', function (done) {
    const userData = { email:"test@gmail.com",password : '12354545998788349923'};
      request(app)
        .post('/v1/auth/signin')
        .send(userData)
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
           expect(res.body.status).to.be.true;
          token = res.body.content.meta.access_token;
          done();
        });
  });
  
  it('4 should verify signin', function (done) {
      request(app)
        .get('/v1/auth/me')
        .set('Authorization', 'Bearer '+token)
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
           expect(res.body.status).to.be.true;
          done();
        });
  });
  
});

//community integration tests
describe('a suite community integration tests', function () {

  this.timeout(10000);

  before(async function() {
    await connectToMongo();
  });

  it('1 should create a new community ',function(done) {
      const userData = { name: 'test community' };
      request(app)
        .post('/v1/community')
        .set('Authorization', 'Bearer '+token)
        .send(userData)
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          expect(res.body.status).to.be.true;
          communityid=res.body.content.data.id
          done();
        });
    });

  it('2 should get all community lists',function(done) {
    request(app)
      .get('/v1/community')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        expect(res.body.status).to.be.true;
        done();
      });
  });

  it('3 should get all community mebers',function(done) {
    request(app)
      .get('/v1/community/'+communityid+ '/members')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        expect(res.body.status).to.be.true;
        done();
      });
  });

  it('4 should get all communities where i am owner', function (done) {
      request(app)
        .get('/v1/community/me/owner')
        .set('Authorization', 'Bearer '+token)
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
           expect(res.body.status).to.be.true;
          done();
        });
  });
  it('5 should get all communities where i am member', function (done) {
      request(app)
        .get('/v1/community/me/member')
        .set('Authorization', 'Bearer '+token)
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
           expect(res.body.status).to.be.true;
          done();
        });
  });

});

//members integration tests
describe('a suite members integration tests', function () {

  this.timeout(10000);

  before(async function() {
    await connectToMongo();
    const userData = { name: 'Test User 2', email: 'test2@example.com', password: '12132424242424242424' };
    const response = await request(app)
      .post('/v1/auth/signup')
      .send(userData);

    if (response.status === 200) {
      userid = response.body.content.data.id;
    }
  });

  after(async function () {
    await usersCollection.deleteOne({name:'Test User 2'})
    await communitiesCollection.deleteOne({name:"test community"})
    await usersCollection.deleteOne({email:"test@gmail.com"})
  });


  it('1 should create a new member ',function(done) {
      const userData = {community:communityid,user:userid,role:roleid };
      request(app)
        .post('/v1/member')
        .set('Authorization', 'Bearer '+token)
        .send(userData)
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          expect(res.body.status).to.be.true;
          done();
        });
  });

  it('2 should delete a member',function(done) {
    request(app)
      .delete('/v1/member/'+userid)
       .set('Authorization', 'Bearer '+token)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        expect(res.body.status).to.be.true;
        done();
      });
  });

});



