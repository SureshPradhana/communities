
var session = require('supertest-session');

const app = require('../../server');
const expect = require('chai').expect;
const { connectToMongo, rolesCollection, usersCollection, communitiesCollection } = require('../../src/database/mongo');

var testSession = null;

// let token="";
let communityid="";
let roleid="";
let userid="";
// let token;

before(function() {
  testSession = session(app);
});

describe('a suite role integration tests', function () {

  this.timeout(10000);

  before(async function() {
    await connectToMongo();
    await rolesCollection.deleteOne({name: 'Test Role 8'});
  });

  it('1 should create a new role',function(done) {
      const roleData = { name: 'Test Role 8' };
      testSession
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
    testSession
        .get('/v1/role')
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          expect(res.body.status).to.be.true;
          done();
        });
  });

});

// auth integration tests
describe('a suite auth integration tests', function() {

  this.timeout(10000);

  before(async function() {
    await connectToMongo();
  });

  it('1 should create a new user using signup', function(done) {
    const userData = { name: 'test user', email: "test@gmail.com", password: '12354545998788349923' };
    testSession
      .post('/v1/auth/signup')
      .send(userData)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        expect(res.body.status).to.be.true;
        done();
      });
  });

  it('2 should throw error on existing user', function(done) {
    const userData = { name: 'test user', email: "test@gmail.com", password: '12354545998788349923' };
    testSession
      .post('/v1/auth/signup')
      .send(userData)
      .expect(400)
      .end(function(err, res) {
        expect(res.body.message).to.be.equal("Email already in use");
        done();
      });
  });
})

//signin
describe('a suite auth signin integration tests', function() {
  this.timeout(20000);
  var authenticatedSession;
  before(async function() {
    await connectToMongo();
  });
  beforeEach(function(done) {
    const userData = { email: 'test@example.com', password: '12354545998788349923' };
    testSession
      .post('/v1/auth/signin')
      .send(userData)
      .end(function(err) {
        if (err) return done(err);
        authenticatedSession = testSession;
        done();
      });
  });
  // after(async function() {
  //   await usersCollection.deleteOne({ name: 'Test User 2' })
  //   await communitiesCollection.deleteOne({ name: "test community" })
  //   await usersCollection.deleteOne({ email: "test@gmail.com" })

  // });

  it('3 should signin', function(done) {
    const userData = { email: "test@gmail.com", password: '12354545998788349923' };
    authenticatedSession
      .post('/v1/auth/signin')
      .send(userData)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        expect(res.body.status).to.be.true;
        done();
      });
  });

  it('4 should verify signin', function(done) {
    authenticatedSession
      .get('/v1/auth/me')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        expect(res.body.status).to.be.true;
        done();
      });
  });
  it('1 should create a new community ',function(done) {
      const userData = { name: 'test community' };
      authenticatedSession
        .post('/v1/community')
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
    authenticatedSession
      .get('/v1/community')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        expect(res.body.status).to.be.true;
        done();
      });
  });

  it('3 should get all community members',function(done) {
    authenticatedSession
      .get('/v1/community/'+communityid+ '/members')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        expect(res.body.status).to.be.true;
        done();
      });
  });

  it('4 should get all communities where i am owner', function (done) {
      authenticatedSession
        .get('/v1/community/me/owner')
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
           expect(res.body.status).to.be.true;
          done();
        });
  });
  it('5 should get all communities where i am member', function (done) {
      authenticatedSession
        .get('/v1/community/me/member')
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
           expect(res.body.status).to.be.true;
          done();
        });
  });

})
//members integration tests
describe('a suite members integration tests', function () {

  this.timeout(10000);

  before(async function() {
    await connectToMongo();
    const userData = { name: 'Test User 2', email: 'test2@example.com', password: '12132424242424242424' };
    const response = await testSession
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
      testSession
        .post('/v1/member')
        .send(userData)
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          expect(res.body.status).to.be.true;
          done();
        });
  });

  it('2 should delete a member',function(done) {
    testSession
      .delete('/v1/member/'+userid)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        expect(res.body.status).to.be.true;
        done();
      });
  });

});



